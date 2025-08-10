// agents/dpga.js
const fs = require('fs');
const path = require('path');
const { generateMockDPGA } = require('../utils/mockLLM');
const { applyMockEdit } = require('./morphApply');
const { runQuery, runSingle, run } = require('../config/database');

const USE_MOCK = (process.env.MOCK === 'true' || !process.env.CLAUDE_API_KEY);

class DynamicPromptGeneratorAgent {
  constructor() {
    this.promptTemplates = new Map();
    this.userPreferences = new Map();
  }

  async loadPromptTemplate(templateName = 'dpga_system') {
    if (this.promptTemplates.has(templateName)) {
      return this.promptTemplates.get(templateName);
    }

    const p = path.join(__dirname, '..', 'prompts', `${templateName}.json`);
    const raw = fs.readFileSync(p, 'utf8');
    const template = JSON.parse(raw).content;
    this.promptTemplates.set(templateName, template);
    return template;
  }

  async callRealClaude(prompt) {
    // Placeholder: implement real Claude API call here
    // For now, we'll use the mock implementation
    return generateMockDPGA({}, {});
  }

  async generatePlanAndMessage(userProfile, features, abnormalities = []) {
    const promptTemplate = await this.loadPromptTemplate();
    
    // Enhanced prompt with cycle phase and abnormalities
    const enhancedFeatures = {
      ...features,
      abnormalities: abnormalities.map(a => a.description),
      cycle_phase: features.cycle_phase || 'unknown',
      day_of_cycle: features.day_of_cycle || 'unknown'
    };

    const filledPrompt = promptTemplate
      .replace('<<USER_PROFILE>>', JSON.stringify(userProfile))
      .replace('<<FEATURES>>', JSON.stringify(enhancedFeatures))
      .replace('<<ABNORMALITIES>>', JSON.stringify(abnormalities));

    let llmOutput;
    if (USE_MOCK) {
      llmOutput = generateMockDPGA(userProfile, enhancedFeatures);
    } else {
      llmOutput = await this.callRealClaude(filledPrompt);
    }

    // Enhanced plan structure
    const enhancedPlan = await this.enhancePlan(llmOutput, userProfile, features);
    
    // Check if UI adaptation is needed
    const uiAdaptation = await this.determineUIAdaptation(features, abnormalities, userProfile);
    
    // Store the plan in database
    await this.storePlan(userProfile.id, enhancedPlan, features);

    return {
      ...enhancedPlan,
      ui_adaptation: uiAdaptation,
      timestamp: new Date().toISOString()
    };
  }

  async enhancePlan(basePlan, userProfile, features) {
    const enhancedPlan = {
      ...basePlan,
      plan_version: Date.now().toString(),
      generated_at: new Date().toISOString(),
      user_id: userProfile.id,
      cycle_context: {
        phase: features.cycle_phase,
        day: features.day_of_cycle,
        next_period_prediction: await this.predictNextPeriod(userProfile.id),
        fertility_window: this.calculateFertilityWindow(features.day_of_cycle, features.cycle_phase),
        optimal_activity_level: this.determineOptimalActivityLevel(features.cycle_phase, features)
      }
    };

    // Add cycle-specific recommendations based on real data patterns
    if (features.cycle_phase === 'menstrual') {
      enhancedPlan.track = enhancedPlan.track || [];
      enhancedPlan.track.push('Monitor flow intensity and color');
      enhancedPlan.track.push('Track pain levels and location');
      enhancedPlan.track.push('Record sleep quality and duration');
      
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Stay hydrated (2.5L water)');
      enhancedPlan.maintain.push('Consider iron-rich foods');
      enhancedPlan.maintain.push('Take regular screen breaks (20-20-20 rule)');
      
      enhancedPlan.treat = enhancedPlan.treat || [];
      if (features.cramps_severity > 2) {
        enhancedPlan.treat.push('Consider gentle heat therapy');
        enhancedPlan.treat.push('Try magnesium supplements');
      }
    }

    if (features.cycle_phase === 'follicular') {
      enhancedPlan.track = enhancedPlan.track || [];
      enhancedPlan.track.push('Monitor energy levels throughout the day');
      enhancedPlan.track.push('Track exercise performance');
      
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Maintain consistent sleep schedule');
      enhancedPlan.maintain.push('Focus on strength training');
    }

    if (features.cycle_phase === 'ovulatory') {
      enhancedPlan.track = enhancedPlan.track || [];
      enhancedPlan.track.push('Monitor cervical mucus changes');
      enhancedPlan.track.push('Track libido changes');
      enhancedPlan.track.push('Record peak energy times');
      
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Maximize high-intensity workouts');
      enhancedPlan.maintain.push('Focus on protein-rich nutrition');
    }

    if (features.cycle_phase === 'luteal') {
      enhancedPlan.track = enhancedPlan.track || [];
      enhancedPlan.track.push('Monitor mood fluctuations');
      enhancedPlan.track.push('Track food cravings');
      enhancedPlan.track.push('Record stress levels');
      
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Practice stress management techniques');
      enhancedPlan.maintain.push('Maintain stable blood sugar with complex carbs');
    }

    // Add personalized recommendations based on user profile
    if (userProfile.preferred_coaching_style === 'motivational') {
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Set daily micro-goals for motivation');
    }

    if (userProfile.journaling_mode === 'audio') {
      enhancedPlan.track = enhancedPlan.track || [];
      enhancedPlan.track.push('Record voice notes about daily experiences');
    }

    if (features.cycle_phase === 'luteal') {
      enhancedPlan.track = enhancedPlan.track || [];
      enhancedPlan.track.push('Monitor mood changes');
      enhancedPlan.track.push('Track food cravings');
      
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Practice stress management techniques');
    }

    // Add personalized goals based on user profile
    if (userProfile.job === 'designer') {
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Take regular screen breaks (20-20-20 rule)');
    }

    return enhancedPlan;
  }

  async determineUIAdaptation(features, abnormalities, userProfile) {
    const adaptations = [];

    // High stress adaptation
    if (features.stress_level > 0.7) {
      adaptations.push({
        type: 'add_component',
        target: 'stress_management_card',
        priority: 'high',
        content: {
          title: 'Stress Management',
          suggestions: ['Deep breathing exercises', 'Take a 5-minute walk', 'Listen to calming music']
        }
      });
    }

    // Sleep issues adaptation
    if (features.sleep_hours < 6) {
      adaptations.push({
        type: 'modify_component',
        target: 'sleep_tracker',
        priority: 'medium',
        changes: {
          highlight: true,
          add_reminder: 'Consider earlier bedtime tonight'
        }
      });
    }

    // Cycle phase adaptation
    if (features.cycle_phase === 'menstrual') {
      adaptations.push({
        type: 'add_component',
        target: 'cycle_phase_card',
        priority: 'high',
        content: {
          title: 'Menstrual Phase',
          phase: 'menstrual',
          day: features.day_of_cycle,
          tips: ['Rest when needed', 'Stay hydrated', 'Gentle exercise only']
        }
      });
    }

    // Abnormalities adaptation
    if (abnormalities.length > 0) {
      adaptations.push({
        type: 'add_component',
        target: 'health_alert',
        priority: 'high',
        content: {
          title: 'Health Alert',
          abnormalities: abnormalities,
          action_required: abnormalities.some(a => a.severity === 'high')
        }
      });
    }

    return adaptations;
  }

  async predictNextPeriod(userId) {
    try {
      const result = await runQuery(
        'SELECT event_date FROM cycle_events WHERE user_id = ? AND event_type = ? ORDER BY event_date DESC LIMIT 1',
        [userId, 'period_start']
      );
      
      if (result.length === 0) return null;
      
      const lastPeriodDate = new Date(result[0].event_date);
      const avgCycleLength = await this.getAverageCycleLength(userId);
      const nextPeriodDate = new Date(lastPeriodDate);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + avgCycleLength);
      
      return nextPeriodDate.toISOString();
    } catch (error) {
      console.error('Error predicting next period:', error);
      return null;
    }
  }

  async getAverageCycleLength(userId) {
    try {
      const result = await runQuery(
        'SELECT event_date FROM cycle_events WHERE user_id = ? AND event_type = ? ORDER BY event_date DESC LIMIT 10',
        [userId, 'period_start']
      );
      
      if (result.length < 2) return 28;
      
      const dates = result.map(row => new Date(row.event_date)).reverse();
      const cycles = [];
      
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
        cycles.push(diff);
      }
      
      return Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
    } catch (error) {
      console.error('Error calculating average cycle length:', error);
      return 28;
    }
  }

  async storePlan(userId, plan, features) {
    try {
      await run(
        'INSERT INTO ai_outputs (user_id, agent_type, features, risk_score, plan, message, version) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          userId,
          'dpga',
          JSON.stringify(features),
          features.risk || 0,
          JSON.stringify(plan),
          plan.message || '',
          plan.plan_version || Date.now().toString()
        ]
      );
    } catch (error) {
      console.error('Error storing plan:', error);
    }
  }

  calculateFertilityWindow(dayOfCycle, cyclePhase) {
    // Fertility window is typically 5 days before ovulation + day of ovulation
    const ovulationDay = 14; // Assuming 28-day cycle
    const fertilityStart = ovulationDay - 5;
    const fertilityEnd = ovulationDay;
    
    return {
      start_day: fertilityStart,
      end_day: fertilityEnd,
      is_fertile: dayOfCycle >= fertilityStart && dayOfCycle <= fertilityEnd,
      days_until_ovulation: Math.max(0, ovulationDay - dayOfCycle)
    };
  }

  determineOptimalActivityLevel(cyclePhase, features) {
    const baseActivity = {
      intensity: 'moderate',
      duration: '30-45 minutes',
      type: 'mixed'
    };

    switch (cyclePhase) {
      case 'menstrual':
        return {
          ...baseActivity,
          intensity: 'low',
          duration: '20-30 minutes',
          type: 'gentle yoga, walking, swimming',
          reason: 'Lower energy levels and potential discomfort'
        };
      case 'follicular':
        return {
          ...baseActivity,
          intensity: 'moderate',
          duration: '30-45 minutes',
          type: 'strength training, cardio',
          reason: 'Rising energy levels and improved performance'
        };
      case 'ovulatory':
        return {
          ...baseActivity,
          intensity: 'high',
          duration: '45-60 minutes',
          type: 'high-intensity training, sports',
          reason: 'Peak energy and performance capabilities'
        };
      case 'luteal':
        return {
          ...baseActivity,
          intensity: 'moderate',
          duration: '30-40 minutes',
          type: 'moderate cardio, yoga, pilates',
          reason: 'Gradually decreasing energy, focus on maintenance'
        };
      default:
        return baseActivity;
    }
  }

  generateHealthInsights(features, abnormalities, userProfile) {
    const insights = {
      cycle_health: this.assessCycleHealth(features),
      sleep_quality: this.assessSleepQuality(features),
      stress_level: this.assessStressLevel(features),
      nutrition_needs: this.assessNutritionNeeds(features, userProfile),
      exercise_recommendations: this.generateExerciseRecommendations(features),
      lifestyle_optimizations: this.generateLifestyleOptimizations(features, userProfile)
    };

    return insights;
  }

  assessCycleHealth(features) {
    const cycleLength = features.cycle_length_days || 28;
    const regularity = Math.abs(cycleLength - 28) <= 3 ? 'regular' : 'irregular';
    
    return {
      regularity: regularity,
      length: cycleLength,
      phase: features.cycle_phase,
      day_of_cycle: features.day_of_cycle,
      health_status: regularity === 'regular' ? 'healthy' : 'needs_attention',
      recommendations: regularity === 'irregular' ? 
        ['Track cycle length consistently', 'Consider stress management', 'Consult healthcare provider if irregular for 3+ cycles'] : 
        ['Continue tracking', 'Maintain healthy lifestyle habits']
    };
  }

  assessSleepQuality(features) {
    const sleepHours = features.sleep_hours || 7;
    const deepSleepPct = features.deep_sleep_pct || 25;
    
    let quality = 'good';
    let recommendations = [];
    
    if (sleepHours < 7) {
      quality = 'needs_improvement';
      recommendations.push('Aim for 7-9 hours of sleep');
    }
    
    if (deepSleepPct < 20) {
      quality = 'needs_improvement';
      recommendations.push('Improve deep sleep with better sleep hygiene');
    }
    
    return {
      quality: quality,
      hours: sleepHours,
      deep_sleep_percentage: deepSleepPct,
      recommendations: recommendations
    };
  }

  assessStressLevel(features) {
    const hrv = features.hrv_ms || 65;
    const busyScore = features.busy_score || 5;
    const sentiment = features.sentiment_score || 0;
    
    let stressLevel = 'low';
    let recommendations = [];
    
    if (hrv < 50) {
      stressLevel = 'high';
      recommendations.push('Practice stress management techniques');
    }
    
    if (busyScore > 6) {
      stressLevel = 'moderate';
      recommendations.push('Consider reducing workload or adding breaks');
    }
    
    if (sentiment < -0.3) {
      stressLevel = 'moderate';
      recommendations.push('Focus on mood-boosting activities');
    }
    
    return {
      level: stressLevel,
      hrv: hrv,
      busy_score: busyScore,
      sentiment: sentiment,
      recommendations: recommendations
    };
  }

  assessNutritionNeeds(features, userProfile) {
    const cyclePhase = features.cycle_phase;
    const recommendations = [];
    
    switch (cyclePhase) {
      case 'menstrual':
        recommendations.push('Increase iron-rich foods');
        recommendations.push('Stay hydrated (2.5L water)');
        recommendations.push('Consider magnesium supplements');
        break;
      case 'follicular':
        recommendations.push('Focus on protein for muscle building');
        recommendations.push('Include complex carbohydrates');
        break;
      case 'ovulatory':
        recommendations.push('Maximize protein intake');
        recommendations.push('Include healthy fats');
        break;
      case 'luteal':
        recommendations.push('Stabilize blood sugar with complex carbs');
        recommendations.push('Reduce caffeine if experiencing anxiety');
        break;
    }
    
    return {
      phase: cyclePhase,
      recommendations: recommendations,
      hydration_goal: '2.5L water daily',
      meal_timing: 'Eat every 3-4 hours to maintain stable blood sugar'
    };
  }

  generateExerciseRecommendations(features) {
    const cyclePhase = features.cycle_phase;
    const painLevel = features.cramps_severity || 0;
    
    if (painLevel > 2) {
      return {
        primary: 'Gentle movement only',
        secondary: 'Walking, gentle yoga, swimming',
        avoid: 'High-intensity exercise, heavy lifting',
        reason: 'High pain levels detected'
      };
    }
    
    switch (cyclePhase) {
      case 'menstrual':
        return {
          primary: 'Low-intensity cardio',
          secondary: 'Walking, gentle yoga, swimming',
          avoid: 'High-intensity training',
          reason: 'Lower energy levels during menstruation'
        };
      case 'follicular':
        return {
          primary: 'Strength training',
          secondary: 'Moderate cardio, HIIT',
          avoid: 'None',
          reason: 'Rising energy and improved performance'
        };
      case 'ovulatory':
        return {
          primary: 'High-intensity training',
          secondary: 'Sports, heavy lifting',
          avoid: 'None',
          reason: 'Peak energy and performance'
        };
      case 'luteal':
        return {
          primary: 'Moderate cardio',
          secondary: 'Yoga, pilates, moderate strength',
          avoid: 'Extreme intensity',
          reason: 'Gradually decreasing energy'
        };
      default:
        return {
          primary: 'Mixed training',
          secondary: 'Moderate intensity activities',
          avoid: 'None',
          reason: 'Balanced approach'
        };
    }
  }

  generateLifestyleOptimizations(features, userProfile) {
    const optimizations = [];
    
    // Sleep optimization
    if (features.sleep_hours < 7) {
      optimizations.push('Establish consistent bedtime routine');
      optimizations.push('Reduce screen time before bed');
    }
    
    // Stress management
    if (features.hrv_ms < 50) {
      optimizations.push('Practice daily meditation or deep breathing');
      optimizations.push('Take regular breaks during work');
    }
    
    // Activity optimization
    if (features.steps < 8000) {
      optimizations.push('Take walking breaks every hour');
      optimizations.push('Use stairs instead of elevator');
    }
    
    // Personalization based on user profile
    if (userProfile.preferred_coaching_style === 'motivational') {
      optimizations.push('Set daily micro-goals for motivation');
    }
    
    if (userProfile.journaling_mode === 'audio') {
      optimizations.push('Record voice notes for reflection');
    }
    
    return optimizations;
  }

  async applyUIAdaptations(adaptations, userId) {
    for (const adaptation of adaptations) {
      try {
        // Store adaptation in database
        await run(
          'INSERT INTO ui_adaptations (user_id, adaptation_type, target_component, changes) VALUES (?, ?, ?, ?)',
          [userId, adaptation.type, adaptation.target, JSON.stringify(adaptation)]
        );

        // If Morph integration is enabled, apply code changes
        if (process.env.MORPH_ENABLED === 'true') {
          await this.applyMorphChanges(adaptation, userId);
        }
      } catch (error) {
        console.error('Error applying UI adaptation:', error);
      }
    }
  }

  async applyMorphChanges(adaptation, userId) {
    // This would integrate with Morph to modify SwiftUI code
    // For now, we'll use the mock implementation
    if (adaptation.type === 'add_component') {
      const morphRequest = {
        target: 'swiftui_components',
        edit_snippet: `// Add ${adaptation.target} component for user ${userId}`
      };
      applyMockEdit(morphRequest.target, morphRequest.edit_snippet);
    }
  }
}

// Backward compatibility
async function generatePlanAndMessage(userProfile, features) {
  const dpga = new DynamicPromptGeneratorAgent();
  return dpga.generatePlanAndMessage(userProfile, features);
}

module.exports = { generatePlanAndMessage, DynamicPromptGeneratorAgent };