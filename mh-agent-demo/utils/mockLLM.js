// utils/mockLLM.js
const fs = require('fs');

function generateMockDPGA(userProfile, features){
  // Very simple heuristics to produce a JSON-like DPGA response
  const { sleep_hours, temp_delta, hr_elevated, bleeding_flag } = features;
  let risk = 0;
  if (sleep_hours < 6) risk += 0.2;
  if (temp_delta > 0.3) risk += 0.25;
  if (hr_elevated) risk += 0.2;
  if (bleeding_flag) risk += 0.3;
  const escalation = risk > 0.6;
  const message = escalation
    ? "Your signals suggest elevated risk—please consider contacting your clinician. If severe, seek emergency care."
    : "Noted: low sleep, heavier cramps. Try 2-min paced breathing and hydrate. I'll check again tomorrow.";

  const plan = {
    plan_version: "v0.1",
    nodes: [
      { id: "breath_1", type: "exercise", trigger: "risk>0.2", channel: "push", content: "2-min breathing" },
      { id: "hydrate", type: "habit", trigger: "always", channel: "push", content: "Drink water: 250ml in next 2 hours" }
    ],
    escalation: escalation ? { threshold: 0.6, note: "High risk flagged" } : null
  };

  return {
    message,
    plan,
    plan_version: plan.plan_version,
    next_questions: bleeding_flag ? ["Is bleeding lighter or heavier than usual? (lighter/same/heavier)"] : [],
    prompt_edit_request: null,
    rationale: `Heuristic risk ${risk.toFixed(2)} from low sleep & temp shift`
  };
}

module.exports = { generateMockDPGA };