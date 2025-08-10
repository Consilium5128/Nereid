// utils/dataLoader.js
const fs = require('fs');
const path = require('path');

function loadDummyUsers() {
  const p = path.join(__dirname, '..', 'data', 'dummy_users.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadDummySignals() {
  const p = path.join(__dirname, '..', 'data', 'dummy_signals.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function generateMockSensorData(userId, days = 7) {
  const signals = [];
  const now = new Date();
  
  for (let day = 0; day < days; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Temperature readings (2 per day)
    signals.push({
      user_id: userId,
      source: 'temp',
      payload: { celsius: 36.5 + Math.random() * 0.6 },
      ts: new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString() // 7 AM
    });
    
    signals.push({
      user_id: userId,
      source: 'temp',
      payload: { celsius: 36.8 + Math.random() * 0.4 },
      ts: new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString() // 2 PM
    });
    
    // Sleep data
    signals.push({
      user_id: userId,
      source: 'sleep',
      payload: { hours: 6 + Math.random() * 3 },
      ts: new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString()
    });
    
    // Heart rate
    signals.push({
      user_id: userId,
      source: 'heart_rate',
      payload: { bpm: 60 + Math.random() * 30 },
      ts: new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString()
    });
    
    // Steps
    signals.push({
      user_id: userId,
      source: 'steps',
      payload: { count: Math.floor(Math.random() * 10000) },
      ts: new Date(date.getTime() + 20 * 60 * 60 * 1000).toISOString()
    });
    
    // Screen time
    signals.push({
      user_id: userId,
      source: 'screen_time',
      payload: { minutes: Math.floor(Math.random() * 300) },
      ts: new Date(date.getTime() + 23 * 60 * 60 * 1000).toISOString()
    });
    
    // Calendar events
    signals.push({
      user_id: userId,
      source: 'calendar',
      payload: { events_today: Math.floor(Math.random() * 8) },
      ts: new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return signals;
}

function generateMockUserLogs(userId, days = 30) {
  const logs = [];
  const now = new Date();
  
  for (let day = 0; day < days; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    const log = {
      user_id: userId,
      log_date: date.toISOString().split('T')[0],
      mood: ['calm', 'happy', 'low', 'irritable', 'anxious'][Math.floor(Math.random() * 5)],
      flow: ['spotting', 'light', 'medium', 'heavy'][Math.floor(Math.random() * 4)],
      color: ['brightRed', 'darkRed', 'brown', 'pink'][Math.floor(Math.random() * 4)],
      pain: ['none', 'crampy', 'backache', 'headache', 'pelvic'][Math.floor(Math.random() * 5)],
      nutrition: ['balanced', 'ironRich', 'lowAppetite', 'highCarb', 'highProtein'][Math.floor(Math.random() * 5)]
    };
    
    logs.push(log);
  }
  
  return logs;
}

function generateMockCycleEvents(userId, months = 6) {
  const events = [];
  const now = new Date();
  
  for (let month = 0; month < months; month++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - month);
    date.setDate(1 + Math.floor(Math.random() * 28)); // Random day in month
    
    events.push({
      user_id: userId,
      event_type: 'period_start',
      event_date: date.toISOString().split('T')[0]
    });
  }
  
  return events;
}

module.exports = {
  loadDummyUsers,
  loadDummySignals,
  generateMockSensorData,
  generateMockUserLogs,
  generateMockCycleEvents
};
