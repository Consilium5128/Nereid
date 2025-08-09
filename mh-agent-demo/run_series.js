// run_series.js
require('dotenv').config(); // <--- load .env into process.env
const fs = require('fs');
const path = require('path');
const { computeFeatures } = require('./agents/saa');
const { generatePlanAndMessage } = require('./agents/dpga');
const { schedulePlan } = require('./services/planner');

const files = [
  'user1_day0_initial.json',
  'user1_day7_suggestion.json',
  'user1_day10_followup.json'
].map(f => path.join(__dirname, 'data', f));

(async () => {
  for (const f of files) {
    console.log('--- Running', f);
    const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
    const { features, risk, summary } = computeFeatures(raw.signals);
    console.log('[SAA] features', features, 'risk', risk.toFixed ? risk.toFixed(2) : risk);
    const dpga = await generatePlanAndMessage({ id: raw.user_id, age: raw.age || null, job: raw.job || null }, features);
    console.log('[DPGA] ->', JSON.stringify(dpga, null, 2));
    schedulePlan({ id: raw.user_id }, dpga);
    // add a small delay so logs are readable (optional)
    await new Promise(r => setTimeout(r, 200));
  }
})();