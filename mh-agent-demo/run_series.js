import fs from 'fs';
import path from 'path';
import { computeFeatures } from './agents/saa.js';
import { generatePlanAndMessage } from './agents/dpga.js'; // new dpga wrapper
import { schedulePlan } from './services/planner.js';

const files = ['user1_day0_initial.json','user1_day7_suggestion.json','user1_day10_followup.json'];

(async()=>{
  for(const f of files){
    console.log('--- Running',f);
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname,'data',f),'utf8'));
    const featuresData = computeFeatures(raw.signals);
    console.log('[SAA] features', featuresData.features, 'risk', featuresData.risk);
    const dpga = await generatePlanAndMessage({id: raw.user_id, onboarding:{}}, featuresData.features);
    console.log('[DPGA] ->', JSON.stringify(dpga, null, 2));
    schedulePlan({id:raw.user_id}, dpga.plan || dpga);
    // optionally simulate user taking actions and then proceed to next file
  }
})();