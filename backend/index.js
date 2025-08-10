// index.js - Enhanced Nereid AI Agent Server
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Import configurations
const { initializeDatabase, runQuery, runSingle, run } = require('./config/database');

// Import agents
const { SignalAnalysisAgent } = require('./agents/saa');
const { DynamicPromptGeneratorAgent } = require('./agents/dpga');
const { HealthAnalysisAgent } = require('./agents/healthAnalysisAgent');
const { UIMorphAgent } = require('./agents/uiMorphAgent');
const { schedulePlan } = require('./services/planner');

// Import utilities
const { loadDummyUsers, loadDummySignals } = require('./utils/dataLoader');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Initialize agents
const saa = new SignalAnalysisAgent();
const dpga = new DynamicPromptGeneratorAgent();
const healthAgent = new HealthAnalysisAgent();
const uiMorphAgent = new UIMorphAgent();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// User management endpoints
app.post('/api/users', async (req, res) => {
  try {
    const { id, age, job, timezone, onboarding, notification_pref } = req.body;
    
    const result = await run(
      'INSERT OR REPLACE INTO users (id, age, job, timezone, onboarding, notification_pref, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [id, age, job, timezone, JSON.stringify(onboarding), notification_pref]
    );
    
    const user = await runSingle('SELECT * FROM users WHERE id = ?', [id]);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await runSingle('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Health Analysis endpoints
app.post('/api/health/analyze/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Load CSV data if not already loaded
    if (!healthAgent.csvData) {
      await healthAgent.loadCSVData();
    }
    
    // Analyze user profile
    const profile = await healthAgent.analyzeUserProfile(userId);
    const cyclePredictions = await healthAgent.predictNextCycles(userId, 30);
    const healthInsights = await healthAgent.generateHealthInsights(userId);
    
    // Save analysis to database
    await healthAgent.saveAnalysisToDatabase(userId, {
      profile,
      cyclePredictions,
      healthInsights
    });
    
    res.json({
      success: true,
      profile,
      cyclePredictions,
      healthInsights
    });
  } catch (error) {
    console.error('Error in health analysis:', error);
    res.status(500).json({ error: 'Failed to analyze health data' });
  }
});

app.get('/api/health/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Load CSV data if not already loaded
    if (!healthAgent.csvData) {
      await healthAgent.loadCSVData();
    }
    
    const profile = await healthAgent.analyzeUserProfile(userId);
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error fetching health profile:', error);
    res.status(500).json({ error: 'Failed to fetch health profile' });
  }
});

app.get('/api/health/predictions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const daysAhead = parseInt(req.query.days) || 30;
    
    // Load CSV data if not already loaded
    if (!healthAgent.csvData) {
      await healthAgent.loadCSVData();
    }
    
    const predictions = await healthAgent.predictNextCycles(userId, daysAhead);
    res.json({ success: true, predictions });
  } catch (error) {
    console.error('Error fetching cycle predictions:', error);
    res.status(500).json({ error: 'Failed to fetch cycle predictions' });
  }
});

app.get('/api/health/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Load CSV data if not already loaded
    if (!healthAgent.csvData) {
      await healthAgent.loadCSVData();
    }
    
    const insights = await healthAgent.generateHealthInsights(userId);
    res.json({ success: true, insights });
  } catch (error) {
    console.error('Error fetching health insights:', error);
    res.status(500).json({ error: 'Failed to fetch health insights' });
  }
});

// UI Adaptation endpoints
app.post('/api/ui/adapt/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userProfile, healthInsights } = req.body;
    
    // Load SwiftUI templates if not already loaded
    if (uiMorphAgent.swiftUITemplates.size === 0) {
      await uiMorphAgent.loadSwiftUITemplates();
    }
    
    const adaptations = await uiMorphAgent.adaptUIForUser(userId, userProfile, healthInsights);
    
    res.json({
      success: true,
      adaptations
    });
  } catch (error) {
    console.error('Error in UI adaptation:', error);
    res.status(500).json({ error: 'Failed to adapt UI' });
  }
});

app.get('/api/ui/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Load CSV data if not already loaded
    if (!healthAgent.csvData) {
      await healthAgent.loadCSVData();
    }
    
    const profile = await healthAgent.analyzeUserProfile(userId);
    const healthInsights = await healthAgent.generateHealthInsights(userId);
    const notifications = await uiMorphAgent.generatePersonalizedNotifications(userId, healthInsights);
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error generating notifications:', error);
    res.status(500).json({ error: 'Failed to generate notifications' });
  }
});

// Demo Generation endpoints
app.post('/api/demos/generate', async (req, res) => {
  try {
    const { DemoGenerator } = require('./scripts/generateDemos');
    const generator = new DemoGenerator();
    const result = await generator.run();
    
    res.json({
      success: result.success,
      data: result.success ? {
        userProfiles: result.userProfiles.length,
        weeklyDemos: result.weeklyDemos.length,
        summary: result.summary
      } : null,
      error: result.error
    });
  } catch (error) {
    console.error('Error generating demos:', error);
    res.status(500).json({ error: 'Failed to generate demos' });
  }
});

app.get('/api/demos/summary', async (req, res) => {
  try {
    const summaryPath = path.join(__dirname, 'data/demos/demo_summary.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      res.json({ success: true, summary });
    } else {
      res.status(404).json({ error: 'Demo summary not found' });
    }
  } catch (error) {
    console.error('Error fetching demo summary:', error);
    res.status(500).json({ error: 'Failed to fetch demo summary' });
  }
});

// Sensor data endpoints
app.post('/api/sensors/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { source, payload, timestamp } = req.body;
    
    const result = await run(
      'INSERT INTO sensor_readings (user_id, source, payload, timestamp) VALUES (?, ?, ?, ?)',
      [userId, source, JSON.stringify(payload), timestamp || new Date().toISOString()]
    );
    
    const reading = await runSingle('SELECT * FROM sensor_readings WHERE id = ?', [result.id]);
    
    // Trigger AI analysis
    await triggerAIAnalysis(userId);
    
    res.json({ success: true, reading });
  } catch (error) {
    console.error('Error storing sensor data:', error);
    res.status(500).json({ error: 'Failed to store sensor data' });
  }
});

app.get('/api/sensors/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, source } = req.query;
    
    let sql = 'SELECT * FROM sensor_readings WHERE user_id = ?';
    let params = [userId];
    
    if (source) {
      sql += ' AND source = ?';
      params.push(source);
    }
    
    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const readings = await runQuery(sql, params);
    res.json({ readings });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// User logs endpoints
app.post('/api/logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { log_date, mood, flow, color, pain, nutrition } = req.body;
    
    const result = await run(
      'INSERT OR REPLACE INTO user_logs (user_id, log_date, mood, flow, color, pain, nutrition) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, log_date, mood, flow, color, pain, nutrition]
    );
    
    const log = await runSingle('SELECT * FROM user_logs WHERE user_id = ? AND log_date = ?', [userId, log_date]);
    
    // Trigger AI analysis
    await triggerAIAnalysis(userId);
    
    res.json({ success: true, log });
  } catch (error) {
    console.error('Error storing user log:', error);
    res.status(500).json({ error: 'Failed to store user log' });
  }
});

app.get('/api/logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const logs = await runQuery(
      'SELECT * FROM user_logs WHERE user_id = ? AND log_date >= date("now", "-? days") ORDER BY log_date DESC',
      [userId, days]
    );
    
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching user logs:', error);
    res.status(500).json({ error: 'Failed to fetch user logs' });
  }
});

// Cycle events endpoints
app.post('/api/cycles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { event_type, event_date } = req.body;
    
    const result = await run(
      'INSERT INTO cycle_events (user_id, event_type, event_date) VALUES (?, ?, ?)',
      [userId, event_type, event_date]
    );
    
    const event = await runSingle('SELECT * FROM cycle_events WHERE id = ?', [result.id]);
    
    // Trigger AI analysis
    await triggerAIAnalysis(userId);
    
    res.json({ success: true, event });
  } catch (error) {
    console.error('Error storing cycle event:', error);
    res.status(500).json({ error: 'Failed to store cycle event' });
  }
});

app.get('/api/cycles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const events = await runQuery(
      'SELECT * FROM cycle_events WHERE user_id = ? ORDER BY event_date DESC LIMIT ?',
      [userId, parseInt(limit)]
    );
    
    res.json({ events });
  } catch (error) {
    console.error('Error fetching cycle events:', error);
    res.status(500).json({ error: 'Failed to fetch cycle events' });
  }
});

// AI analysis endpoints
app.post('/api/analyze/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await triggerAIAnalysis(userId);
    res.json(result);
  } catch (error) {
    console.error('Error triggering AI analysis:', error);
    res.status(500).json({ error: 'Failed to trigger AI analysis' });
  }
});

app.get('/api/analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;
    
    const analyses = await runQuery(
      'SELECT * FROM ai_outputs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, parseInt(limit)]
    );
    
    res.json({ analyses });
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    res.status(500).json({ error: 'Failed to fetch AI analysis' });
  }
});

// Predictions endpoint
app.get('/api/predictions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const nextPeriod = await saa.predictNextPeriod(userId);
    const avgCycleLength = await saa.getAverageCycleLength(userId);
    
    res.json({
      next_period_start: nextPeriod,
      average_cycle_length: avgCycleLength,
      current_phase: await saa.determineCyclePhase(userId, 0, false),
      day_of_cycle: await saa.calculateDayOfCycle(userId)
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// UI adaptations endpoint
app.get('/api/ui-adaptations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const adaptations = await runQuery(
      'SELECT * FROM ui_adaptations WHERE user_id = ? ORDER BY applied_at DESC LIMIT 10',
      [userId]
    );
    
    res.json({ adaptations });
  } catch (error) {
    console.error('Error fetching UI adaptations:', error);
    res.status(500).json({ error: 'Failed to fetch UI adaptations' });
  }
});

// Demo endpoint (for testing)
app.get('/demo', async (req, res) => {
  try {
    const users = loadDummyUsers();
    const signals = loadDummySignals();
    const user = users[0];
    const userSignals = signals.filter(s => s.user_id === user.id);
    
    console.log('\n=== Incoming signals ===');
    console.log(userSignals);

    // 1) SAA
    const saaResult = await saa.computeFeatures(userSignals, user.id);
    console.log('\n[SAA] Features:', saaResult.features);
    console.log('[SAA] risk:', saaResult.risk.toFixed(2));
    console.log('[SAA] summary:', saaResult.summary);

    // 2) Detect abnormalities
    const abnormalities = await saa.detectAbnormalities(saaResult.features, user.id);
    console.log('[SAA] Abnormalities:', abnormalities);

    // 3) DPGA (LLM)
    const dpgaOutput = await dpga.generatePlanAndMessage(user, saaResult.features, abnormalities);
    console.log('\n[DPGA] Output:\n', JSON.stringify(dpgaOutput, null, 2));

    // 4) Apply UI adaptations
    if (dpgaOutput.ui_adaptation) {
      await dpga.applyUIAdaptations(dpgaOutput.ui_adaptation, user.id);
    }

    // 5) Planner
    const plannerRes = schedulePlan(user, dpgaOutput);
    console.log('[Planner] result:', plannerRes);

    res.json({ 
      ok: true, 
      user: user.id, 
      saa: saaResult, 
      abnormalities,
      dpga: dpgaOutput, 
      planner: plannerRes 
    });
  } catch (error) {
    console.error('Demo error:', error);
    res.status(500).json({ error: 'Demo failed' });
  }
});

// AI Analysis trigger function
async function triggerAIAnalysis(userId) {
  try {
    // Get recent sensor data
    const sensorResult = await runQuery(
      'SELECT * FROM sensor_readings WHERE user_id = ? AND timestamp >= datetime("now", "-24 hours") ORDER BY timestamp DESC',
      [userId]
    );
    
    // Get recent user logs
    const logsResult = await runQuery(
      'SELECT * FROM user_logs WHERE user_id = ? AND log_date >= date("now", "-7 days") ORDER BY log_date DESC',
      [userId]
    );
    
    // Get user profile
    const user = await runSingle('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found');
    }
    
    const signals = sensorResult.map(row => ({
      user_id: row.user_id,
      source: row.source,
      payload: JSON.parse(row.payload),
      ts: row.timestamp
    }));
    
    // Run SAA
    const saaResult = await saa.computeFeatures(signals, userId);
    
    // Detect abnormalities
    const abnormalities = await saa.detectAbnormalities(saaResult.features, userId);
    
    // Run DPGA
    const dpgaOutput = await dpga.generatePlanAndMessage(user, saaResult.features, abnormalities);
    
    // Apply UI adaptations
    if (dpgaOutput.ui_adaptation) {
      await dpga.applyUIAdaptations(dpgaOutput.ui_adaptation, userId);
    }
    
    return { saa: saaResult, dpga: dpgaOutput, abnormalities };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw error;
  }
}

// Scheduled tasks
cron.schedule('0 */6 * * *', async () => {
  // Run AI analysis every 6 hours for all users
  try {
    const users = await runQuery('SELECT id FROM users');
    for (const user of users) {
      await triggerAIAnalysis(user.id);
    }
    console.log('Scheduled AI analysis completed');
  } catch (error) {
    console.error('Scheduled AI analysis failed:', error);
  }
});

// Initialize server
async function initializeServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Nereid AI Agent Server running on http://localhost:${PORT}`);
      console.log('Available endpoints:');
      console.log('  GET  /health');
      console.log('  POST /api/users');
      console.log('  GET  /api/users/:userId');
      console.log('  POST /api/sensors/:userId');
      console.log('  GET  /api/sensors/:userId');
      console.log('  POST /api/logs/:userId');
      console.log('  GET  /api/logs/:userId');
      console.log('  POST /api/cycles/:userId');
      console.log('  GET  /api/cycles/:userId');
      console.log('  POST /api/analyze/:userId');
      console.log('  GET  /api/analysis/:userId');
      console.log('  GET  /api/predictions/:userId');
      console.log('  GET  /api/ui-adaptations/:userId');
      console.log('  GET  /demo');
    });
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
}

// Start the server
initializeServer();
