// index.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { computeFeatures } = require('./agents/saa');
const { generatePlanAndMessage } = require('./agents/dpga_mock');
const { schedulePlan } = require('./services/planner');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

function loadDummyUsers(){
  const p = path.join(__dirname, 'data', 'dummy_users.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function loadDummySignals(){
  const p = path.join(__dirname, 'data', 'dummy_signals.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * /demo
 * Runs the pipeline for user-1 using the dummy signals.
 */
app.get('/demo', async (req, res) => {
  const users = loadDummyUsers();
  const signals = loadDummySignals();
  const user = users[0];
  // for demo, take all signals for user
  const userSignals = signals.filter(s => s.user_id === user.id);
  console.log('\n=== Incoming signals ===');
  console.log(userSignals);

  // 1) SAA
  const { features, risk, summary } = computeFeatures(userSignals);
  console.log('\n[SAA] Features:', features);
  console.log('[SAA] risk:', risk.toFixed(2));
  console.log('[SAA] summary:', summary);

  // 2) DPGA (LLM)
  const dpgaOutput = await generatePlanAndMessage(user, features);
  console.log('\n[DPGA] Output:\n', JSON.stringify(dpgaOutput, null, 2));

  // 3) Planner
  const plannerRes = schedulePlan(user, dpgaOutput);
  console.log('[Planner] result:', plannerRes);

  // 4) (Delivery would happen here be it push, sms, etc.)
  console.log('\n[Demo complete]');

  res.json({ ok: true, user: user.id, features, risk, dpgaOutput, plannerRes });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));