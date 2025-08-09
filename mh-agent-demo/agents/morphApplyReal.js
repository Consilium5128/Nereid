// agents/morphApplyReal.js
import fetch from 'node-fetch';
const MORPH_KEY = process.env.MORPH_API_KEY;
const MORPH_APPLY_ENDPOINT = process.env.MORPH_ENDPOINT || 'https://api.morphllm.com/v1/apply';

export async function morphApply(originalFileContent, editSnippet, instruction, model='morph-v3') {
  if (!MORPH_KEY) throw new Error('Missing MORPH_API_KEY in env');
  const payload = {
    model, // pick the Apply model name from your Morph account/docs (e.g., morph-v3)
    file: originalFileContent,
    update: editSnippet,
    instruction
  };
  const r = await fetch(MORPH_APPLY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MORPH_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Morph Apply error: ${r.status} ${txt}`);
  }
  const j = await r.json();
  // j.merged_file or j.output: check the returned shape; log it first
  return j;
}