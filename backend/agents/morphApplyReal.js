// agents/morphApplyReal.js (CommonJS)
const fetchFn = (typeof globalThis.fetch === 'function') ? globalThis.fetch : (function () {
  try {
    return require('undici').fetch;
  } catch (e) {
    throw new Error('No fetch available. Use Node >=18 or install undici: npm install undici');
  }
})();

const MORPH_KEY = process.env.MORPH_API_KEY;
const MORPH_ENDPOINT = process.env.MORPH_ENDPOINT || 'https://api.morphllm.com/v1/apply';
const MORPH_MODEL = process.env.MORPH_MODEL || 'morph-v3';

async function morphApply(originalFileContent, editSnippet, instruction, model = MORPH_MODEL) {
  if (!MORPH_KEY) throw new Error('Missing MORPH_API_KEY in env');

  const payload = {
    model,
    file: originalFileContent,
    update: editSnippet,
    instruction
  };

  const res = await fetchFn(MORPH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MORPH_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Morph Apply error ${res.status}: ${txt}`);
  }

  const j = await res.json();
  return j;
}

module.exports = { morphApply };