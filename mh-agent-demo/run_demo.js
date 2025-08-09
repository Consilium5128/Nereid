// run_demo.js
const fetch = globalThis.fetch;
const url = 'http://localhost:3000/demo';
(async () => {
  try {
    const r = await fetch(url);
    const j = await r.json();
    console.log('\n/demo response:', JSON.stringify(j, null, 2));
  } catch (e) {
    console.error('Error calling demo:', e);
  }
})();