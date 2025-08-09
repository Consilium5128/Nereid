// agents/dpga.js
const fs = require('fs');
const path = require('path');
const { generateMockDPGA } = require('../utils/mockLLM');
const { applyMockEdit } = require('./morphApply');

const USE_MOCK = (process.env.MOCK === 'true' || !process.env.CLAUDE_API_KEY);

async function loadPromptTemplate(){
  const p = path.join(__dirname, '..', 'prompts', 'dpga_system.json');
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw).content;
}

async function callRealClaude(prompt){ 
  // placeholder: if you wire real API, implement fetch to Anthropic (Claude) here.
  // For demo, we fallback to mock.
  return generateMockDPGA({}, {});
}

async function generatePlanAndMessage(userProfile, features){
  const promptTemplate = await loadPromptTemplate();
  // For simplicity we do string replace; in production use proper templating
  const filledPrompt = promptTemplate
    .replace('<<USER_PROFILE>>', JSON.stringify(userProfile))
    .replace('<<FEATURES>>', JSON.stringify(features));

  let llmOutput;
  if(USE_MOCK){
    llmOutput = generateMockDPGA(userProfile, features);
  } else {
    llmOutput = await callRealClaude(filledPrompt);
  }

  // If dpga asked for a prompt edit request (in real life), call Morph Apply
  if(llmOutput.prompt_edit_request){
    const req = llmOutput.prompt_edit_request;
    // req.target expected like "cycle_predictor" and edit_snippet text
    const res = applyMockEdit(req.target, req.edit_snippet || '// mock edit');
    llmOutput._morphResult = res;
  }

  return llmOutput;
}

module.exports = { generatePlanAndMessage };