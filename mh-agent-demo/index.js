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
const { pool, initializeDatabase } = require('./config/database');
const { connectRedis, publishMessage, subscribeToChannel } = require('./config/redis');

// Import agents
const { SignalAnalysisAgent } = require('./agents/saa');
const { DynamicPromptGeneratorAgent } = require('./agents/dpga');
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
    
    const result = await pool.query(
      'INSERT INTO users (id, age, job, timezone, onboarding, notification_pref) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP RETURNING *',
      [id, age, job, timezone, JSON.stringify(onboarding), notification_pref]
    );
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Sensor data endpoints
app.post('/api/sensors/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { source, payload, timestamp } = req.body;
    
    const result = await pool.query(
      'INSERT INTO sensor_readings (user_id, source, payload, timestamp) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, source, JSON.stringify(payload), timestamp || new Date()]
    );
    
    // Trigger AI analysis
    await triggerAIAnalysis(userId);
    
    res.json({ success: true, reading: result.rows[0] });
  } catch (error) {
    console.error('Error storing sensor data:', error);
    res.status(500).json({ error: 'Failed to store sensor data' });
  }
});

app.get('/api/sensors/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100, source } = req.query;
    
    let query = 'SELECT * FROM sensor_readings WHERE user_id = $1';
    let params = [userId];
    
    if (source) {
      query += ' AND source = $2';
      params.push(source);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1);
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json({ readings: result.rows });
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
    
    const result = await pool.query(
      'INSERT INTO user_logs (user_id, log_date, mood, flow, color, pain, nutrition) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (user_id, log_date) DO UPDATE SET mood = EXCLUDED.mood, flow = EXCLUDED.flow, color = EXCLUDED.color, pain = EXCLUDED.pain, nutrition = EXCLUDED.nutrition RETURNING *',
      [userId, log_date, mood, flow, color, pain, nutrition]
    );
    
    // Trigger AI analysis
    await triggerAIAnalysis(userId);
    
    res.json({ success: true, log: result.rows[0] });
  } catch (error) {
    console.error('Error storing user log:', error);
    res.status(500).json({ error: 'Failed to store user log' });
  }
});

app.get('/api/logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const result = await pool.query(
      'SELECT * FROM user_logs WHERE user_id = $1 AND log_date >= CURRENT_DATE - INTERVAL \'$2 days\' ORDER BY log_date DESC',
      [userId, days]
    );
    
    res.json({ logs: result.rows });
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
    
    const result = await pool.query(
      'INSERT INTO cycle_events (user_id, event_type, event_date) VALUES ($1, $2, $3) RETURNING *',
      [userId, event_type, event_date]
    );
    
    // Trigger AI analysis
    await triggerAIAnalysis(userId);
    
    res.json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Error storing cycle event:', error);
    res.status(500).json({ error: 'Failed to store cycle event' });
  }
});

app.get('/api/cycles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const result = await pool.query(
      'SELECT * FROM cycle_events WHERE user_id = $1 ORDER BY event_date DESC LIMIT $2',
      [userId, parseInt(limit)]
    );
    
    res.json({ events: result.rows });
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
    
    const result = await pool.query(
      'SELECT * FROM ai_outputs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, parseInt(limit)]
    );
    
    res.json({ analyses: result.rows });
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
    
    const result = await pool.query(
      'SELECT * FROM ui_adaptations WHERE user_id = $1 ORDER BY applied_at DESC LIMIT 10',
      [userId]
    );
    
    res.json({ adaptations: result.rows });
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
    const sensorResult = await pool.query(
      'SELECT * FROM sensor_readings WHERE user_id = $1 AND timestamp >= CURRENT_TIMESTAMP - INTERVAL \'24 hours\' ORDER BY timestamp DESC',
      [userId]
    );
    
    // Get recent user logs
    const logsResult = await pool.query(
      'SELECT * FROM user_logs WHERE user_id = $1 AND log_date >= CURRENT_DATE - INTERVAL \'7 days\' ORDER BY log_date DESC',
      [userId]
    );
    
    // Get user profile
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    const signals = sensorResult.rows.map(row => ({
      user_id: row.user_id,
      source: row.source,
      payload: row.payload,
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
    
    // Publish to Redis for real-time updates
    await publishMessage('ai_analysis', {
      user_id: userId,
      saa: saaResult,
      dpga: dpgaOutput,
      abnormalities,
      timestamp: new Date().toISOString()
    });
    
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
    const users = await pool.query('SELECT id FROM users');
    for (const user of users.rows) {
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
    
    // Connect to Redis
    await connectRedis();
    console.log('Redis connected');
    
    // Subscribe to UI adaptation channel
    await subscribeToChannel('ui_adaptations', (message) => {
      console.log('UI adaptation received:', message);
    });
    
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