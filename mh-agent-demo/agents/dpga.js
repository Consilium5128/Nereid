// agents/dpga.js
// Minimal DPGA implementation that always exports generatePlanAndMessage.
// Uses the mock LLM by default for local demos.

const path = require('path');
const fs = require('fs');

// Try to use a real Claude wrapper if present, otherwise fallback to mock
let callClaudeForPlan = null;
try {
  callClaudeForPlan = require('./claudeDPGA').callClaudeForPlan;
} catch (e) {
  callClaudeForPlan = null;
}

let morphApply = null;
try {
  morphApply = require('./morphApplyReal').morphApply;
} catch (e) {
  morphApply = null;
}

// Fallback mock generator from utils/mockLLM.js
const { generateMockDPGA } = require('../utils/mockLLM');

const promptCache = new Map();

/* load prompt into cache (if exists) */
function loadPromptToCache(promptName = 'dpga_system') {
  const p = path.join(__dirname, '..', 'prompts', promptName + '.json');
  if (fs.existsSync(p)) {
    const raw = fs.readFileSync(p, 'utf8');
    try {
      const json = JSON.parse(raw);
      promptCache.set(promptName, json.content);
      return json.content;
    } catch (e) {
      // fall through
      promptCache.set(promptName, raw);
      return raw;
    }
  } else {
    // no prompt file — set a simple default template
    const defaultTemplate = 'SYSTEM: DPGA template. Replace <<USER_PROFILE>> and <<FEATURES>>.';
    promptCache.set(promptName, defaultTemplate);
    return defaultTemplate;
  }
}

/* safe JSON extraction helper */
function extractJsonBlock(text) {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

/* persist plan to disk for debugging */
function persistPlanDump(obj) {
  const outdir = path.join(__dirname, '..', 'plans');
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
  const fname = `plan_${Date.now()}.json`;
  fs.writeFileSync(path.join(outdir, fname), JSON.stringify(obj, null, 2));
}

/* Main exported function */
async function generatePlanAndMessage(userProfile = {}, features = {}) {
  // Ensure dpga_system prompt loaded
  if (!promptCache.has('dpga_system')) loadPromptToCache('dpga_system');

  // Construct minimal filled prompt (for real Claude path)
  const template = promptCache.get('dpga_system');
  const filledPrompt = template
    .replace('<<USER_PROFILE>>', JSON.stringify({ id: userProfile.id, age: userProfile.age, job: userProfile.job }))
    .replace('<<FEATURES>>', JSON.stringify(features));

  // Use mock if no real Claude wrapper present or MOCK=true
  const useMock = (process.env.MOCK === 'true' || !callClaudeForPlan);
  if (useMock) {
    // returns an object with {message, plan, plan_version, next_questions, ...}
    const out = generateMockDPGA(userProfile, features);
    persistPlanDump(out);
    return out;
  }

  // Real Claude flow (if callClaudeForPlan exists)
  try {
    const claudeResp = await callClaudeForPlan(filledPrompt, 800);
    // try to extract the textual output from different shapes
    let textOut = null;
    if (typeof claudeResp === 'string') textOut = claudeResp;
    else if (claudeResp.completion) textOut = claudeResp.completion;
    else if (claudeResp.output) textOut = claudeResp.output;
    else if (claudeResp.choices && claudeResp.choices[0] && claudeResp.choices[0].text) textOut = claudeResp.choices[0].text;
    else if (claudeResp.choices && claudeResp.choices[0] && claudeResp.choices[0].message) textOut = claudeResp.choices[0].message.content;
    else textOut = JSON.stringify(claudeResp);

    // parse JSON output
    let parsed = null;
    try {
      parsed = JSON.parse(textOut);
    } catch (e) {
      const block = extractJsonBlock(textOut);
      if (!block) {
        console.error('[DPGA] Could not parse Claude output, returning fallback plan. Raw:', textOut);
        parsed = {
          message: 'Sorry, I could not process this right now.',
          plan: { plan_version: 'v0.0-fallback', nodes: [] },
          plan_version: 'v0.0-fallback',
          next_questions: [],
          prompt_edit_request: null,
          rationale: 'fallback due to parse error'
        };
      } else {
        parsed = JSON.parse(block);
      }
    }

    // If parsed contains prompt_edit_request and morphApply exists, call it
    if (parsed && parsed.prompt_edit_request && parsed.prompt_edit_request.target && parsed.prompt_edit_request.edit_snippet) {
      const target = parsed.prompt_edit_request.target;
      const edit_snippet = parsed.prompt_edit_request.edit_snippet;
      // load original
      const pf = path.join(__dirname, '..', 'prompts', target + '.json');
      const original = fs.existsSync(pf) ? (JSON.parse(fs.readFileSync(pf, 'utf8')).content || '') : '';
      if (morphApply) {
        try {
          const morphResp = await morphApply(original, edit_snippet, `Apply DPGA edit to ${target}`);
          // persist morphological output if present
          const merged = morphResp.merged || morphResp.output || morphResp.updated_text || JSON.stringify(morphResp);
          fs.writeFileSync(pf, JSON.stringify({ name: target, content: merged }, null, 2));
          promptCache.set(target, merged);
          parsed._morph = { ok: true };
        } catch (merr) {
          console.error('[DPGA] morphApply failed:', merr);
          parsed._morph = { ok: false, err: String(merr) };
        }
      } else {
        // fallback merge: append edit snippet
        const merged = original + '\n\n// DPGA-requested-edit (mock append)\n' + edit_snippet;
        fs.writeFileSync(pf, JSON.stringify({ name: target, content: merged }, null, 2));
        promptCache.set(target, merged);
        parsed._morph = { ok: 'mock-append' };
      }
    }

    persistPlanDump(parsed);
    return parsed;

  } catch (err) {
    console.error('[DPGA] Error calling Claude path:', err);
    return {
      message: "Error processing request.",
      plan: { plan_version: 'v0.0-err', nodes: [] },
      plan_version: 'v0.0-err',
      next_questions: [],
      prompt_edit_request: null,
      rationale: 'error fallback'
    };
  }
}

module.exports = { generatePlanAndMessage, promptCache, loadPromptToCache };