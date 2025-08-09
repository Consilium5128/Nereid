// agents/saa.js
const fs = require('fs');

function computeFeatures(signals){
  // Simplified features: average temp delta (relative to baseline), sleep hours last, hr elevated, bleeding_flag
  const baselineTemp = 36.6;
  let temps = signals.filter(s => s.source === 'temp').map(s => s.payload.celsius);
  let avgTemp = temps.length ? temps.reduce((a,b)=>a+b,0)/temps.length : baselineTemp;
  const temp_delta = +(avgTemp - baselineTemp).toFixed(2);

  const sleepEvent = signals.find(s => s.source === 'sleep');
  const sleep_hours = sleepEvent ? sleepEvent.payload.hours : 7;

  const hrEvent = signals.find(s => s.source === 'heart_rate');
  const hr_elevated = hrEvent ? hrEvent.payload.bpm > 75 : false;

  const manualText = signals.find(s => s.source === 'manual_text');
  const bleeding_flag = manualText ? /blood|heavy|clot/i.test(manualText.payload.text) : false;

  const features = {
    avg_temp: avgTemp,
    temp_delta,
    sleep_hours,
    hr_elevated,
    bleeding_flag
  };

  // Basic risk scoring
  let risk = 0;
  if (sleep_hours < 6) risk += 0.2;
  if (temp_delta > 0.3) risk += 0.25;
  if (hr_elevated) risk += 0.2;
  if (bleeding_flag) risk += 0.35;
  risk = Math.min(1, risk);

  const summary = `temp_delta=${temp_delta}, sleep=${sleep_hours}h, hr_elevated=${hr_elevated}, bleeding_flag=${bleeding_flag}`;

  return { features, risk, summary };
}

module.exports = { computeFeatures };