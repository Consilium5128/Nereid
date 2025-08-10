// agents/saa.js
const fs = require('fs');
const { pool } = require('../config/database');

class SignalAnalysisAgent {
  constructor() {
    this.baselineTemp = 36.6;
    this.cycleLengths = new Map(); // user_id -> [cycle_lengths]
    this.userProfiles = new Map(); // user_id -> profile
  }

  async computeFeatures(signals, userId) {
    // Enhanced feature computation with cycle prediction
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

    // Enhanced features
    const stepsEvent = signals.find(s => s.source === 'steps');
    const steps = stepsEvent ? stepsEvent.payload.count : 0;
    
    const screenEvent = signals.find(s => s.source === 'screen_time');
    const screen_time = screenEvent ? screenEvent.payload.minutes : 0;

    const calendarEvent = signals.find(s => s.source === 'calendar');
    const stress_level = calendarEvent ? Math.min(1, calendarEvent.payload.events_today / 8) : 0;

    const features = {
      avg_temp: avgTemp,
      temp_delta,
      sleep_hours,
      hr_elevated,
      bleeding_flag,
      steps,
      screen_time_hours: screen_time / 60,
      stress_level,
      day_of_cycle: await this.calculateDayOfCycle(userId),
      cycle_phase: await this.determineCyclePhase(userId, temp_delta, bleeding_flag)
    };

    // Enhanced risk scoring
    const risk = this.calculateRiskScore(features);
    const uncertainty = this.calculateUncertainty(features);
    const summary = this.generateSummary(features, risk, uncertainty);

    return { features, risk, uncertainty, summary };
  }

  async calculateDayOfCycle(userId) {
    try {
      // Get user's cycle events
      const result = await pool.query(
        'SELECT event_date FROM cycle_events WHERE user_id = $1 AND event_type = $2 ORDER BY event_date DESC LIMIT 1',
        [userId, 'period_start']
      );
      
      if (result.rows.length === 0) return null;
      
      const lastPeriodStart = new Date(result.rows[0].event_date);
      const today = new Date();
      const daysSince = Math.floor((today - lastPeriodStart) / (1000 * 60 * 60 * 24));
      
      // Get average cycle length
      const cycleLength = await this.getAverageCycleLength(userId);
      if (cycleLength && daysSince > cycleLength) {
        return daysSince % cycleLength;
      }
      
      return daysSince;
    } catch (error) {
      console.error('Error calculating day of cycle:', error);
      return null;
    }
  }

  async determineCyclePhase(userId, tempDelta, bleedingFlag) {
    const dayOfCycle = await this.calculateDayOfCycle(userId);
    if (!dayOfCycle) return 'unknown';

    if (bleedingFlag) return 'menstrual';
    if (dayOfCycle >= 1 && dayOfCycle <= 5) return 'menstrual';
    if (dayOfCycle >= 6 && dayOfCycle <= 10) return 'follicular';
    if (dayOfCycle >= 11 && dayOfCycle <= 17) return 'ovulatory';
    if (dayOfCycle >= 18 && dayOfCycle <= 28) return 'luteal';
    
    return 'unknown';
  }

  async getAverageCycleLength(userId) {
    try {
      const result = await pool.query(
        'SELECT event_date FROM cycle_events WHERE user_id = $1 AND event_type = $2 ORDER BY event_date DESC LIMIT 10',
        [userId, 'period_start']
      );
      
      if (result.rows.length < 2) return 28; // default
      
      const dates = result.rows.map(row => new Date(row.event_date)).reverse();
      const cycles = [];
      
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
        cycles.push(diff);
      }
      
      const avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
      return avgCycle;
    } catch (error) {
      console.error('Error calculating average cycle length:', error);
      return 28;
    }
  }

  calculateRiskScore(features) {
    let risk = 0;
    
    // Sleep risk
    if (features.sleep_hours < 6) risk += 0.2;
    else if (features.sleep_hours < 7) risk += 0.1;
    
    // Temperature risk
    if (features.temp_delta > 0.5) risk += 0.3;
    else if (features.temp_delta > 0.3) risk += 0.15;
    
    // Heart rate risk
    if (features.hr_elevated) risk += 0.2;
    
    // Bleeding risk
    if (features.bleeding_flag) risk += 0.35;
    
    // Stress risk
    if (features.stress_level > 0.7) risk += 0.15;
    
    // Screen time risk (affects sleep)
    if (features.screen_time_hours > 4) risk += 0.1;
    
    // Activity risk
    if (features.steps < 3000) risk += 0.1;
    
    return Math.min(1, risk);
  }

  calculateUncertainty(features) {
    let uncertainty = 0;
    
    // High uncertainty if missing key data
    if (!features.day_of_cycle) uncertainty += 0.3;
    if (features.cycle_phase === 'unknown') uncertainty += 0.2;
    
    // High uncertainty if data is inconsistent
    if (features.temp_delta > 0.8) uncertainty += 0.2; // unusual temp
    if (features.sleep_hours < 4 || features.sleep_hours > 10) uncertainty += 0.15;
    
    // High uncertainty if stress is high (affects cycle)
    if (features.stress_level > 0.8) uncertainty += 0.25;
    
    return Math.min(1, uncertainty);
  }

  generateSummary(features, risk, uncertainty) {
    const phase = features.cycle_phase || 'unknown';
    const day = features.day_of_cycle || 'unknown';
    
    return `Phase: ${phase}, Day: ${day}, Temp: ${features.temp_delta.toFixed(2)}°C, Sleep: ${features.sleep_hours}h, Risk: ${(risk * 100).toFixed(0)}%, Uncertainty: ${(uncertainty * 100).toFixed(0)}%`;
  }

  async predictNextPeriod(userId) {
    try {
      const avgCycleLength = await this.getAverageCycleLength(userId);
      const lastPeriod = await pool.query(
        'SELECT event_date FROM cycle_events WHERE user_id = $1 AND event_type = $2 ORDER BY event_date DESC LIMIT 1',
        [userId, 'period_start']
      );
      
      if (lastPeriod.rows.length === 0) return null;
      
      const lastPeriodDate = new Date(lastPeriod.rows[0].event_date);
      const nextPeriodDate = new Date(lastPeriodDate);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycleLength);
      
      return nextPeriodDate;
    } catch (error) {
      console.error('Error predicting next period:', error);
      return null;
    }
  }

  async detectAbnormalities(features, userId) {
    const abnormalities = [];
    
    // Irregular cycle detection
    const avgCycleLength = await this.getAverageCycleLength(userId);
    if (avgCycleLength > 35) {
      abnormalities.push({
        type: 'irregular_cycle',
        severity: 'moderate',
        description: 'Cycle length is longer than typical (35+ days)',
        actionable: true
      });
    }
    
    // Temperature abnormalities
    if (features.temp_delta > 0.8) {
      abnormalities.push({
        type: 'elevated_temperature',
        severity: 'high',
        description: 'Significantly elevated body temperature',
        actionable: true
      });
    }
    
    // Sleep abnormalities
    if (features.sleep_hours < 5) {
      abnormalities.push({
        type: 'insufficient_sleep',
        severity: 'high',
        description: 'Very low sleep duration',
        actionable: true
      });
    }
    
    // Stress indicators
    if (features.stress_level > 0.8) {
      abnormalities.push({
        type: 'high_stress',
        severity: 'moderate',
        description: 'High stress levels detected',
        actionable: true
      });
    }
    
    return abnormalities;
  }
}

// Backward compatibility
function computeFeatures(signals) {
  const saa = new SignalAnalysisAgent();
  return saa.computeFeatures(signals, 'user-1'); // default user for backward compatibility
}

module.exports = { computeFeatures, SignalAnalysisAgent };