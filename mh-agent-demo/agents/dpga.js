// agents/dpga.js
// CommonJS module for the DPGA orchestration (Claude + Morph Apply integration)
const fs = require('fs');
const path = require('path');

const USE_MOCK = (process.env.MOCK === 'true' || !process.env.CLAUDE_API_KEY);

// try to load real wrappers; if not present, we'll use mock functions
let callClaudeForPlan;
try {
  callClaudeForPlan = require('./claudeDPGA').callClaudeForPlan;
} catch (e) {
  callClaudeForPlan = null;
}

let morphApply;
try {
  morphApply = require('./morphApplyReal').morphApply;
} catch (e) {
  morphApply = null;
}

// fallback mock generator
const { generateMockDPGA } = require('../utils/mockLLM');

// in-memory prompt cache for hot-reload
const promptCache = new Map();

/* helper: load prompt template into cache (initial load) */
function loadPromptToCache(promptName) {
  const p = path.join(__dirname, '..', 'prompts', promptName + '.json');
  if (!fs.existsSync(p)) {
    throw new Error(`[DPGA] prompt file not found: ${p}`);
  }
  const raw = fs.readFileSync(p, 'utf8');
  const json = JSON.parse(raw);
  promptCache.set(promptName, json.content);
  return json.content;
}

/* helper: safe JSON block extractor (find first balanced {...} block) */
function extractJsonBlock(text) {
  if (typeof text !== 'string') return null;
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) {
      const substr = text.slice(start, i + 1);
      return substr;
    }
  }
  return null;
}

/* helper: write merged prompt and update cache + history */
function persistMergedPrompt(promptName, mergedContent) {
  const p = path.join(__dirname, '..', 'prompts', promptName + '.json');
  const obj = { name: promptName, content: mergedContent, updated_at: new Date().toISOString() };
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  // write history
  const historyDir = path.join(__dirname, '..', 'prompts', 'history');
  if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });
  fs.writeFileSync(path.join(historyDir, `${promptName}_${Date.now()}.json`), JSON.stringify(obj, null, 2));
  // update in-memory cache
  promptCache.set(promptName, mergedContent);
}

/* public function: generatePlanAndMessage */
async function generatePlanAndMessage(userProfile, features) {
  // ensure dpga_system prompt loaded
  const PROMPT_NAME = 'dpga_system';
  if (!promptCache.has(PROMPT_NAME)) {
    try { loadPromptToCache(PROMPT_NAME); }
    catch (err) { console.error('[DPGA] could not preload prompt', err); throw err; }
  }

  const template = promptCache.get(PROMPT_NAME);
  // do a simple string replace for two placeholders (keep template compact)
  const filledPrompt = template
    .replace('<<USER_PROFILE>>', JSON.stringify({ id: userProfile.id, age: userProfile.age, job: userProfile.job }))
    .replace('<<FEATURES>>', JSON.stringify(features));

  let rawOutput;
  if (USE_MOCK || !callClaudeForPlan) {
    // local mock path
    console.log('[DPGA] using MOCK Claude');
    rawOutput = generateMockDPGA(userProfile, features);
    // mockLLM already returns object
    const parsed = rawOutput;
    // no prompt_edit_request typically in mock
    return parsed;
  }

  // Real Claude path
  try {
    const claudeResp = await callClaudeForPlan(filledPrompt, 800);
    // The response shape differs between API versions.
    // Log full response for debugging on first runs:
    // console.log('[DPGA] raw claudeResp:', JSON.stringify(claudeResp, null, 2));
    // Attempt to extract text output
    let textOut = null;
    // Common places: claudeResp.completion, claudeResp.output, claudeResp.choices[0].text, etc.
    if (typeof claudeResp === 'string') textOut = claudeResp;
    else if (claudeResp.completion) textOut = claudeResp.completion;
    else if (claudeResp.output) textOut = claudeResp.output;
    else if (claudeResp.choices && claudeResp.choices[0] && claudeResp.choices[0].text) textOut = claudeResp.choices[0].text;
    else if (claudeResp.choices && claudeResp.choices[0] && claudeResp.choices[0].message) textOut = claudeResp.choices[0].message.content;
    else textOut = JSON.stringify(claudeResp);

    // Try parse JSON directly, else extract JSON block
    let parsed;
    try {
      parsed = JSON.parse(textOut);
    } catch (e) {
      // try to extract first JSON-looking block
      const block = extractJsonBlock(textOut);
      if (!block) {
        console.error('[DPGA] could not find JSON block in Claude output. Raw text:\n', textOut);
        throw new Error('Failed to parse Claude output to JSON');
      }
      parsed = JSON.parse(block);
    }

    // If DPGA asked for a prompt edit, call Morph Apply
    if (parsed.prompt_edit_request && parsed.prompt_edit_request.target && parsed.prompt_edit_request.edit_snippet) {
      console.log('[DPGA] prompt_edit_request detected for', parsed.prompt_edit_request.target);
      // load original content
      const pName = parsed.prompt_edit_request.target;
      const promptFile = path.join(__dirname, '..', 'prompts', pName + '.json');
      let original = null;
      if (fs.existsSync(promptFile)) {
        original = JSON.parse(fs.readFileSync(promptFile, 'utf8')).content;
      } else {
        original = ''; // empty if not found
      }

      // If Morph SDK/wrapper exists, call it
      if (morphApply) {
        try {
          const morphResp = await morphApply(original, parsed.prompt_edit_request.edit_snippet,
            `Apply requested edit to prompt "${pName}" while preserving JSON-only outputs and brevity.`);
          // Morph's response shape may vary: check for merged/output/updated_text
          const merged = morphResp.merged || morphResp.output || morphResp.updated_text || (typeof morphResp === 'string' ? morphResp : JSON.stringify(morphResp));
          // persist and hot-reload
          persistMergedPrompt(pName, merged);
          // attach morph result for observability
          parsed._morph_result = { success: true, merged_preview: merged.slice(0, 400) };
        } catch (merr) {
          console.error('[DPGA] Morph Apply failed:', merr);
          parsed._morph_result = { success: false, error: String(merr) };
        }
      } else {
        // fallback mock apply (naive append)
        const merged = original + '\n\n// DPGA-requested edit (mock apply):\n' + parsed.prompt_edit_request.edit_snippet;
        persistMergedPrompt(pName, merged);
        parsed._morph_result = { success: true, merged_preview: merged.slice(0, 400), note: 'mock apply used' };
      }
    }

    // Persist plan to disk (simple local store)
    const plansDir = path.join(__dirname, '..', 'plans');
    if (!fs.existsSync(plansDir)) fs.mkdirSync(plansDir);
    fs.writeFileSync(path.join(plansDir, `plan_${Date.now()}.json`), JSON.stringify(parsed.plan || parsed, null, 2));

    return parsed;

  } catch (err) {
    console.error('[DPGA] error calling Claude or processing result:', err);
    // fallback: return a safe minimal plan
    return {
      message: "I'm having trouble right now. Please try again.",
      plan: { plan_version: "v0.0-fallback", nodes: [] },
      plan_version: "v0.0-fallback",
      next_questions: [],
      prompt_edit_request: null,
      rationale: "fallback due to error"
    };
  }
}

module.exports = { generatePlanAndMessage, promptCache, loadPromptToCache };