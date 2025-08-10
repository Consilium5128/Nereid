// scripts/setup-database.js
require('dotenv').config();
const { initializeDatabase, run } = require('../config/database');
const { generateMockSensorData, generateMockUserLogs, generateMockCycleEvents } = require('../utils/dataLoader');

async function setupDatabase() {
  try {
    console.log('Setting up Nereid database...');
    
    // Initialize database tables
    await initializeDatabase();
    
    // Create a test user
    const testUser = {
      id: 'user-1',
      age: 28,
      job: 'designer',
      timezone: 'America/Los_Angeles',
      onboarding: {
        last_period_start: '2025-01-01',
        typical_cycle_length: 28,
        typical_period_length: 5
      },
      notification_pref: 'minimal'
    };
    
    await run(
      'INSERT OR REPLACE INTO users (id, age, job, timezone, onboarding, notification_pref, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [testUser.id, testUser.age, testUser.job, testUser.timezone, JSON.stringify(testUser.onboarding), testUser.notification_pref]
    );
    
    console.log('Test user created');
    
    // Generate and insert mock sensor data
    const sensorData = generateMockSensorData('user-1', 14);
    for (const signal of sensorData) {
      await run(
        'INSERT INTO sensor_readings (user_id, source, payload, timestamp) VALUES (?, ?, ?, ?)',
        [signal.user_id, signal.source, JSON.stringify(signal.payload), signal.ts]
      );
    }
    
    console.log(`${sensorData.length} sensor readings inserted`);
    
    // Generate and insert mock user logs
    const userLogs = generateMockUserLogs('user-1', 30);
    for (const log of userLogs) {
      await run(
        'INSERT OR REPLACE INTO user_logs (user_id, log_date, mood, flow, color, pain, nutrition) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [log.user_id, log.log_date, log.mood, log.flow, log.color, log.pain, log.nutrition]
      );
    }
    
    console.log(`${userLogs.length} user logs inserted`);
    
    // Generate and insert mock cycle events
    const cycleEvents = generateMockCycleEvents('user-1', 6);
    for (const event of cycleEvents) {
      await run(
        'INSERT INTO cycle_events (user_id, event_type, event_date) VALUES (?, ?, ?)',
        [event.user_id, event.event_type, event.event_date]
      );
    }
    
    console.log(`${cycleEvents.length} cycle events inserted`);
    
    console.log('Database setup completed successfully!');
    console.log('\nYou can now run the server with: npm start');
    console.log('Test the API with: curl http://localhost:3000/demo');
    
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    console.log('Setup completed successfully!');
  }
}

setupDatabase();
