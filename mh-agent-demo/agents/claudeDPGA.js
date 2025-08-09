// agents/claudeDPGA.js (CommonJS, Messages API, returns plain text)

const fetchFn = (typeof globalThis.fetch === 'function')
  ? globalThis.fetch
  : (function () {
      try { return require('undici').fetch; }
      catch { throw new Error('No fetch available. Use Node >=18 or `npm i undici`.'); }
    })();

const CLAUDE_KEY      = process.env.CLAUDE_API_KEY;
const CLAUDE_ENDPOINT = process.env.CLAUDE_ENDPOINT || 'https://api.anthropic.com/v1/messages';
// pick whatever your account has (e.g. 'claude-3-5-sonnet-20240620' or 'claude-3-5-sonnet-latest')
const CLAUDE_MODEL    = process.env.CLAUDE_MODEL    || 'claude-3-5-sonnet-20240620';

async function callClaudeForPlan(promptText, maxTokens = 800) {
  if (!CLAUDE_KEY) throw new Error('Missing CLAUDE_API_KEY in env');

  // Messages API requires: messages[], max_tokens, anthropic-version header
  const body = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    temperature: 0,
    messages: [
      // keep it simple: send your filled prompt as one user text block
      { role: 'user', content: [{ type: 'text', text: promptText }] }
    ]
    // (optional) you could also pass a separate `system` string if you want
  };

  const res = await fetchFn(CLAUDE_ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_KEY,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Claude error ${res.status}: ${raw}`);
  }

  let j;
  try { j = JSON.parse(raw); }
  catch { throw new Error(`Claude JSON parse error: ${raw}`); }

  // Messages API returns assistant text in j.content[].text
  const text = Array.isArray(j.content)
    ? j.content.map(part => part && part.text ? part.text : '').join('')
    : '';

  return text; // dpga.js expects a string it can JSON.parse (your agent’s JSON)
}

module.exports = { callClaudeForPlan };