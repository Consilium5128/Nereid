import fetch from 'node-fetch'; // or use global fetch in Node18+
const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_ENDPOINT = process.env.CLAUDE_ENDPOINT || 'https://api.anthropic.com/v1/complete';

export async function callClaudeForPlan(promptText, maxTokens=800) {
  if (!CLAUDE_KEY) throw new Error('Missing CLAUDE_API_KEY in env');
  const body = {
    model: 'claude-3.5-sonnet',   // check your Anthropic account for available model names
    prompt: promptText,
    max_tokens_to_sample: maxTokens,
    temperature: 0.0
  };
  const r = await fetch(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if(!r.ok) {
    const txt = await r.text();
    throw new Error(`Claude error: ${r.status} ${txt}`);
  }
  const j = await r.json();
  // The response shape can vary — find the text field that contains the model output
  // Commonly j.completion or j.response; check your console by logging j
  return j;
}