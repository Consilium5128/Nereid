// agents/healthAnalysisAgent.js
const fs = require('fs');
const path = require('path');
const { runQuery, runSingle } = require('../config/database');

class HealthAnalysisAgent {
  constructor() {
    this.csvData = null;
    this.userProfiles = new Map();
    this.cyclePredictions = new Map();
    this.healthInsights = new Map();
  }

  async loadCSVData() {
    try {
      const csvPath = path.join(__dirname, '../data/High-Performer_Athlete___2_Months__v6_schema_.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      
      this.csvData = lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim();
        });
        return row;
      }).filter(row => row.patient_id && row.date);
      
      console.log(`Loaded ${this.csvData.length} data points for analysis`);
      return this.csvData;
    } catch (error) {
      console.error('Error loading CSV data:', error);
      throw error;
    }
  }

  async analyzeUserProfile(userId) {
    const userData = this.csvData.filter(row => row.patient_id === userId);
    if (userData.length === 0) {
      throw new Error(`No data found for user ${userId}`);
    }

    const profile = {
      userId,
      age: parseInt(userData[0].age),
      conditions: {
        pcos: userData[0].has_pcos === 'True',
        endometriosis: userData[0].has_endometriosis === 'True',
        irregularPeriods: userData[0].irregular_periods === 'True',
        weightGain: userData[0].weight_gain_flag === 'True',
        insulinResistance: userData[0].insulin_resistance_flag === 'True',
        ovarianCysts: userData[0].ovarian_cysts_flag === 'True',
        hairThinning: userData[0].hair_thinning_flag === 'True',
        heavyBleeding: userData[0].heavy_bleeding_flag === 'True',
        infertility: userData[0].infertility_flag === 'True',
        giIssues: userData[0].gi_issues_flag === 'True'
      },
      preferences: {
        journalingMode: userData[0].journaling_mode,
        goalFocus: userData[0].goal_focus,
        coachingStyle: userData[0].preferred_coaching_style
      },
      cyclePattern: this.analyzeCyclePattern(userData),
      healthMetrics: this.analyzeHealthMetrics(userData),
      lifestyleFactors: this.analyzeLifestyleFactors(userData)
    };

    this.userProfiles.set(userId, profile);
    return profile;
  }

  analyzeCyclePattern(userData) {
    const cycleLengths = userData
      .filter(row => row.cycle_length_days && !isNaN(row.cycle_length_days))
      .map(row => parseInt(row.cycle_length_days));
    
    const flowDurations = userData
      .filter(row => row.flow_duration_days && !isNaN(row.flow_duration_days))
      .map(row => parseInt(row.flow_duration_days));

    return {
      averageCycleLength: cycleLengths.length > 0 ? 
        Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : 28,
      averageFlowDuration: flowDurations.length > 0 ? 
        Math.round(flowDurations.reduce((a, b) => a + b, 0) / flowDurations.length) : 5,
      regularity: this.calculateCycleRegularity(cycleLengths),
      phases: this.analyzePhasePatterns(userData)
    };
  }

  analyzeHealthMetrics(userData) {
    const metrics = {
      hrv: {
        average: 0,
        trend: 'stable',
        optimalRange: [60, 100]
      },
      sleep: {
        averageHours: 0,
        deepSleepPercentage: 0,
        quality: 'good'
      },
      bbt: {
        average: 0,
        follicular: 0,
        luteal: 0
      },
      activity: {
        averageSteps: 0,
        averageActiveMinutes: 0
      },
      symptoms: {
        cramps: { average: 0, severity: 'low' },
        bodyPain: { average: 0, severity: 'low' },
        backPain: { average: 0, severity: 'low' },
        mood: { average: 0, trend: 'stable' }
      }
    };

    // Calculate averages
    const hrvValues = userData.filter(row => row.hrv_ms && !isNaN(row.hrv_ms)).map(row => parseFloat(row.hrv_ms));
    const sleepValues = userData.filter(row => row.sleep_hours && !isNaN(row.sleep_hours)).map(row => parseFloat(row.sleep_hours));
    const deepSleepValues = userData.filter(row => row.deep_sleep_pct && !isNaN(row.deep_sleep_pct)).map(row => parseFloat(row.deep_sleep_pct));
    const bbtValues = userData.filter(row => row.bbt_c && !isNaN(row.bbt_c)).map(row => parseFloat(row.bbt_c));
    const stepsValues = userData.filter(row => row.steps && !isNaN(row.steps)).map(row => parseInt(row.steps));
    const activeValues = userData.filter(row => row.active_minutes && !isNaN(row.active_minutes)).map(row => parseInt(row.active_minutes));

    if (hrvValues.length > 0) {
      metrics.hrv.average = Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length);
      metrics.hrv.trend = this.calculateTrend(hrvValues);
    }

    if (sleepValues.length > 0) {
      metrics.sleep.averageHours = Math.round(sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length * 10) / 10;
    }

    if (deepSleepValues.length > 0) {
      metrics.sleep.deepSleepPercentage = Math.round(deepSleepValues.reduce((a, b) => a + b, 0) / deepSleepValues.length);
    }

    if (bbtValues.length > 0) {
      metrics.bbt.average = Math.round(bbtValues.reduce((a, b) => a + b, 0) / bbtValues.length * 10) / 10;
    }

    if (stepsValues.length > 0) {
      metrics.activity.averageSteps = Math.round(stepsValues.reduce((a, b) => a + b, 0) / stepsValues.length);
    }

    if (activeValues.length > 0) {
      metrics.activity.averageActiveMinutes = Math.round(activeValues.reduce((a, b) => a + b, 0) / activeValues.length);
    }

    // Analyze symptoms
    const crampsValues = userData.filter(row => row.cramps_severity && !isNaN(row.cramps_severity)).map(row => parseInt(row.cramps_severity));
    const bodyPainValues = userData.filter(row => row.body_pain_severity && !isNaN(row.body_pain_severity)).map(row => parseInt(row.body_pain_severity));
    const backPainValues = userData.filter(row => row.back_pain_severity && !isNaN(row.back_pain_severity)).map(row => parseInt(row.back_pain_severity));
    const moodValues = userData.filter(row => row.mood_rating && !isNaN(row.mood_rating)).map(row => parseInt(row.mood_rating));

    if (crampsValues.length > 0) {
      metrics.symptoms.cramps.average = Math.round(crampsValues.reduce((a, b) => a + b, 0) / crampsValues.length * 10) / 10;
      metrics.symptoms.cramps.severity = this.getSeverityLevel(metrics.symptoms.cramps.average);
    }

    if (bodyPainValues.length > 0) {
      metrics.symptoms.bodyPain.average = Math.round(bodyPainValues.reduce((a, b) => a + b, 0) / bodyPainValues.length * 10) / 10;
      metrics.symptoms.bodyPain.severity = this.getSeverityLevel(metrics.symptoms.bodyPain.average);
    }

    if (backPainValues.length > 0) {
      metrics.symptoms.backPain.average = Math.round(backPainValues.reduce((a, b) => a + b, 0) / backPainValues.length * 10) / 10;
      metrics.symptoms.backPain.severity = this.getSeverityLevel(metrics.symptoms.backPain.average);
    }

    if (moodValues.length > 0) {
      metrics.symptoms.mood.average = Math.round(moodValues.reduce((a, b) => a + b, 0) / moodValues.length * 10) / 10;
      metrics.symptoms.mood.trend = this.calculateTrend(moodValues);
    }

    return metrics;
  }

  analyzeLifestyleFactors(userData) {
    const factors = {
      caffeine: {
        average: 0,
        impact: 'moderate'
      },
      stress: {
        averageBusyScore: 0,
        meetingsPerDay: 0,
        stressLevel: 'moderate'
      },
      environment: {
        averageLightMinutes: 0,
        sunnyDays: 0,
        averageUVIndex: 0,
        averageTemperature: 0,
        averageAQI: 0,
        averagePollenCount: 0
      },
      travel: {
        flightDays: 0,
        averageJetLag: 0
      }
    };

    const caffeineValues = userData.filter(row => row.caffeine_intake_drinks_per_day && !isNaN(row.caffeine_intake_drinks_per_day)).map(row => parseInt(row.caffeine_intake_drinks_per_day));
    const busyValues = userData.filter(row => row.busy_score && !isNaN(row.busy_score)).map(row => parseInt(row.busy_score));
    const meetingValues = userData.filter(row => row.meetings_per_day && !isNaN(row.meetings_per_day)).map(row => parseInt(row.meetings_per_day));
    const lightValues = userData.filter(row => row.ambient_light_minutes && !isNaN(row.ambient_light_minutes)).map(row => parseInt(row.ambient_light_minutes));
    const uvValues = userData.filter(row => row.uv_index && !isNaN(row.uv_index)).map(row => parseFloat(row.uv_index));
    const tempValues = userData.filter(row => row.ambient_temp_c && !isNaN(row.ambient_temp_c)).map(row => parseFloat(row.ambient_temp_c));
    const aqiValues = userData.filter(row => row.aqi && !isNaN(row.aqi)).map(row => parseInt(row.aqi));
    const pollenValues = userData.filter(row => row.pollen_count && !isNaN(row.pollen_count)).map(row => parseInt(row.pollen_count));

    if (caffeineValues.length > 0) {
      factors.caffeine.average = Math.round(caffeineValues.reduce((a, b) => a + b, 0) / caffeineValues.length * 10) / 10;
      factors.caffeine.impact = factors.caffeine.average > 3 ? 'high' : factors.caffeine.average > 1 ? 'moderate' : 'low';
    }

    if (busyValues.length > 0) {
      factors.stress.averageBusyScore = Math.round(busyValues.reduce((a, b) => a + b, 0) / busyValues.length);
      factors.stress.stressLevel = factors.stress.averageBusyScore > 6 ? 'high' : factors.stress.averageBusyScore > 3 ? 'moderate' : 'low';
    }

    if (meetingValues.length > 0) {
      factors.stress.meetingsPerDay = Math.round(meetingValues.reduce((a, b) => a + b, 0) / meetingValues.length * 10) / 10;
    }

    if (lightValues.length > 0) {
      factors.environment.averageLightMinutes = Math.round(lightValues.reduce((a, b) => a + b, 0) / lightValues.length);
    }

    if (uvValues.length > 0) {
      factors.environment.averageUVIndex = Math.round(uvValues.reduce((a, b) => a + b, 0) / uvValues.length * 10) / 10;
    }

    if (tempValues.length > 0) {
      factors.environment.averageTemperature = Math.round(tempValues.reduce((a, b) => a + b, 0) / tempValues.length * 10) / 10;
    }

    if (aqiValues.length > 0) {
      factors.environment.averageAQI = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    }

    if (pollenValues.length > 0) {
      factors.environment.averagePollenCount = Math.round(pollenValues.reduce((a, b) => a + b, 0) / pollenValues.length);
    }

    factors.environment.sunnyDays = userData.filter(row => row.is_sunny === 'True').length;
    factors.travel.flightDays = userData.filter(row => row.flight_flag === 'True').length;

    const jetLagValues = userData.filter(row => row.jet_lag_hours && !isNaN(row.jet_lag_hours)).map(row => parseFloat(row.jet_lag_hours));
    if (jetLagValues.length > 0) {
      factors.travel.averageJetLag = Math.round(jetLagValues.reduce((a, b) => a + b, 0) / jetLagValues.length * 10) / 10;
    }

    return factors;
  }

  calculateCycleRegularity(cycleLengths) {
    if (cycleLengths.length < 2) return 'unknown';
    
    const mean = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const variance = cycleLengths.reduce((sum, length) => sum + Math.pow(length - mean, 2), 0) / cycleLengths.length;
    const stdDev = Math.sqrt(variance);
    
    const coefficientOfVariation = stdDev / mean;
    
    if (coefficientOfVariation < 0.1) return 'very_regular';
    if (coefficientOfVariation < 0.2) return 'regular';
    if (coefficientOfVariation < 0.3) return 'moderately_irregular';
    return 'irregular';
  }

  analyzePhasePatterns(userData) {
    const phases = {
      menstrual: { count: 0, averageSymptoms: {} },
      follicular: { count: 0, averageSymptoms: {} },
      ovulatory: { count: 0, averageSymptoms: {} },
      luteal: { count: 0, averageSymptoms: {} }
    };

    userData.forEach(row => {
      if (row.cycle_phase && phases[row.cycle_phase]) {
        phases[row.cycle_phase].count++;
      }
    });

    return phases;
  }

  calculateTrend(values) {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(-3);
    const earlier = values.slice(-6, -3);
    
    if (earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  }

  getSeverityLevel(average) {
    if (average <= 1) return 'none';
    if (average <= 2) return 'mild';
    if (average <= 3) return 'moderate';
    return 'severe';
  }

  async predictNextCycles(userId, daysAhead = 30) {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`No profile found for user ${userId}`);
    }

    const predictions = [];
    const lastDate = new Date(this.csvData[this.csvData.length - 1].date);
    const cycleLength = profile.cyclePattern.averageCycleLength;
    
    for (let i = 1; i <= Math.ceil(daysAhead / cycleLength); i++) {
      const predictedStart = new Date(lastDate);
      predictedStart.setDate(predictedStart.getDate() + (i * cycleLength));
      
      const cycle = {
        startDate: predictedStart.toISOString().split('T')[0],
        endDate: new Date(predictedStart.getTime() + (cycleLength - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        length: cycleLength,
        phases: this.predictPhases(predictedStart, cycleLength, profile.cyclePattern.averageFlowDuration),
        confidence: this.calculatePredictionConfidence(profile.cyclePattern.regularity)
      };
      
      predictions.push(cycle);
    }

    this.cyclePredictions.set(userId, predictions);
    return predictions;
  }

  predictPhases(startDate, cycleLength, flowDuration) {
    const phases = [];
    const start = new Date(startDate);
    
    // Menstrual phase
    phases.push({
      name: 'menstrual',
      startDate: start.toISOString().split('T')[0],
      endDate: new Date(start.getTime() + (flowDuration - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: flowDuration
    });

    // Follicular phase (from end of menstrual to ovulation)
    const follicularStart = new Date(start.getTime() + flowDuration * 24 * 60 * 60 * 1000);
    const follicularDuration = Math.floor((cycleLength - flowDuration) * 0.6);
    phases.push({
      name: 'follicular',
      startDate: follicularStart.toISOString().split('T')[0],
      endDate: new Date(follicularStart.getTime() + (follicularDuration - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: follicularDuration
    });

    // Ovulatory phase
    const ovulatoryStart = new Date(follicularStart.getTime() + follicularDuration * 24 * 60 * 60 * 1000);
    const ovulatoryDuration = 3;
    phases.push({
      name: 'ovulatory',
      startDate: ovulatoryStart.toISOString().split('T')[0],
      endDate: new Date(ovulatoryStart.getTime() + (ovulatoryDuration - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: ovulatoryDuration
    });

    // Luteal phase
    const lutealStart = new Date(ovulatoryStart.getTime() + ovulatoryDuration * 24 * 60 * 60 * 1000);
    const lutealDuration = cycleLength - flowDuration - follicularDuration - ovulatoryDuration;
    phases.push({
      name: 'luteal',
      startDate: lutealStart.toISOString().split('T')[0],
      endDate: new Date(lutealStart.getTime() + (lutealDuration - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: lutealDuration
    });

    return phases;
  }

  calculatePredictionConfidence(regularity) {
    switch (regularity) {
      case 'very_regular': return 0.95;
      case 'regular': return 0.85;
      case 'moderately_irregular': return 0.70;
      case 'irregular': return 0.55;
      default: return 0.75;
    }
  }

  async generateHealthInsights(userId) {
    const profile = this.userProfiles.get(userId);
    if (!profile) {
      throw new Error(`No profile found for user ${userId}`);
    }

    const insights = {
      userId,
      timestamp: new Date().toISOString(),
      cycleInsights: this.generateCycleInsights(profile),
      healthInsights: this.generateHealthRecommendations(profile),
      lifestyleInsights: this.generateLifestyleRecommendations(profile),
      riskFactors: this.identifyRiskFactors(profile),
      goals: this.generatePersonalizedGoals(profile),
      notifications: this.generateNotificationSchedule(profile)
    };

    this.healthInsights.set(userId, insights);
    return insights;
  }

  generateCycleInsights(profile) {
    const insights = [];
    
    if (profile.cyclePattern.regularity === 'irregular') {
      insights.push({
        type: 'warning',
        title: 'Irregular Cycle Pattern',
        message: 'Your cycle shows irregular patterns. Consider tracking additional factors like stress, sleep, and nutrition.',
        priority: 'high'
      });
    }

    if (profile.healthMetrics.symptoms.cramps.severity === 'severe') {
      insights.push({
        type: 'alert',
        title: 'Severe Cramping',
        message: 'You experience severe cramps during menstruation. Consider consulting with a healthcare provider.',
        priority: 'high'
      });
    }

    if (profile.healthMetrics.sleep.averageHours < 7) {
      insights.push({
        type: 'recommendation',
        title: 'Sleep Optimization',
        message: 'Your average sleep duration is below recommended levels. This may impact cycle regularity and overall health.',
        priority: 'medium'
      });
    }

    return insights;
  }

  generateHealthRecommendations(profile) {
    const recommendations = [];

    // HRV recommendations
    if (profile.healthMetrics.hrv.average < 60) {
      recommendations.push({
        category: 'cardiovascular',
        title: 'Improve Heart Rate Variability',
        description: 'Your HRV is below optimal range. Focus on stress management, regular exercise, and quality sleep.',
        actionable: true,
        priority: 'medium'
      });
    }

    // Sleep recommendations
    if (profile.healthMetrics.sleep.deepSleepPercentage < 30) {
      recommendations.push({
        category: 'sleep',
        title: 'Enhance Deep Sleep',
        description: 'Your deep sleep percentage is low. Consider reducing screen time before bed and maintaining a consistent sleep schedule.',
        actionable: true,
        priority: 'medium'
      });
    }

    // Activity recommendations
    if (profile.healthMetrics.activity.averageSteps < 8000) {
      recommendations.push({
        category: 'activity',
        title: 'Increase Daily Activity',
        description: 'Aim for at least 8,000 steps daily to support hormonal balance and overall health.',
        actionable: true,
        priority: 'low'
      });
    }

    return recommendations;
  }

  generateLifestyleRecommendations(profile) {
    const recommendations = [];

    // Caffeine recommendations
    if (profile.lifestyleFactors.caffeine.average > 3) {
      recommendations.push({
        category: 'nutrition',
        title: 'Reduce Caffeine Intake',
        description: 'High caffeine consumption may impact sleep quality and hormonal balance. Consider limiting to 2-3 drinks per day.',
        actionable: true,
        priority: 'medium'
      });
    }

    // Stress recommendations
    if (profile.lifestyleFactors.stress.stressLevel === 'high') {
      recommendations.push({
        category: 'stress',
        title: 'Stress Management',
        description: 'High stress levels can impact cycle regularity. Consider meditation, exercise, or professional support.',
        actionable: true,
        priority: 'high'
      });
    }

    // Environmental recommendations
    if (profile.lifestyleFactors.environment.averageLightMinutes < 60) {
      recommendations.push({
        category: 'environment',
        title: 'Increase Natural Light Exposure',
        description: 'Low light exposure may impact circadian rhythm. Try to spend more time outdoors during daylight hours.',
        actionable: true,
        priority: 'low'
      });
    }

    return recommendations;
  }

  identifyRiskFactors(profile) {
    const risks = [];

    // PCOS risks
    if (profile.conditions.pcos) {
      risks.push({
        condition: 'PCOS',
        riskLevel: 'high',
        factors: ['irregular periods', 'insulin resistance', 'weight gain'],
        recommendations: ['Regular exercise', 'Balanced diet', 'Stress management']
      });
    }

    // Endometriosis risks
    if (profile.conditions.endometriosis) {
      risks.push({
        condition: 'Endometriosis',
        riskLevel: 'high',
        factors: ['severe pain', 'heavy bleeding'],
        recommendations: ['Pain management strategies', 'Regular check-ups', 'Lifestyle modifications']
      });
    }

    // General health risks
    if (profile.healthMetrics.symptoms.mood.average < 3) {
      risks.push({
        condition: 'Mood Concerns',
        riskLevel: 'medium',
        factors: ['low mood ratings'],
        recommendations: ['Mental health support', 'Regular exercise', 'Social connection']
      });
    }

    return risks;
  }

  generatePersonalizedGoals(profile) {
    const goals = [];

    // Sleep goals
    if (profile.healthMetrics.sleep.averageHours < 8) {
      goals.push({
        category: 'sleep',
        title: 'Improve Sleep Duration',
        target: '8 hours per night',
        current: `${profile.healthMetrics.sleep.averageHours} hours`,
        timeframe: '30 days',
        actionable: true
      });
    }

    // Activity goals
    if (profile.healthMetrics.activity.averageSteps < 10000) {
      goals.push({
        category: 'activity',
        title: 'Increase Daily Steps',
        target: '10,000 steps',
        current: `${profile.healthMetrics.activity.averageSteps} steps`,
        timeframe: '30 days',
        actionable: true
      });
    }

    // Stress management goals
    if (profile.lifestyleFactors.stress.stressLevel === 'high') {
      goals.push({
        category: 'stress',
        title: 'Reduce Stress Levels',
        target: 'Moderate stress level',
        current: 'High stress level',
        timeframe: '30 days',
        actionable: true
      });
    }

    return goals;
  }

  generateNotificationSchedule(profile) {
    const notifications = [];

    // Cycle tracking reminders
    notifications.push({
      type: 'cycle_tracking',
      title: 'Track Your Cycle',
      message: 'Log your symptoms and observations for better predictions',
      frequency: 'daily',
      time: '20:00',
      enabled: true
    });

    // Health check-ins
    notifications.push({
      type: 'health_checkin',
      title: 'Health Check-in',
      message: 'How are you feeling today?',
      frequency: 'daily',
      time: '09:00',
      enabled: true
    });

    // Goal reminders
    if (profile.lifestyleFactors.stress.stressLevel === 'high') {
      notifications.push({
        type: 'stress_management',
        title: 'Stress Management',
        message: 'Take a moment to practice stress reduction techniques',
        frequency: 'daily',
        time: '12:00',
        enabled: true
      });
    }

    return notifications;
  }

  async saveAnalysisToDatabase(userId, analysis) {
    try {
      await runQuery(
        'INSERT OR REPLACE INTO health_analysis (user_id, analysis_data, created_at) VALUES (?, ?, ?)',
        [userId, JSON.stringify(analysis), new Date().toISOString()]
      );
      console.log(`Health analysis saved for user ${userId}`);
    } catch (error) {
      console.error('Error saving health analysis:', error);
      throw error;
    }
  }
}

module.exports = { HealthAnalysisAgent };
