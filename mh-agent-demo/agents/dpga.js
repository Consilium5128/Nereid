// agents/dpga.js
const fs = require('fs');
const path = require('path');
const { generateMockDPGA } = require('../utils/mockLLM');
const { applyMockEdit } = require('./morphApply');
const { pool } = require('../config/database');
const { publishMessage } = require('../config/redis');

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
        next_period_prediction: await this.predictNextPeriod(userProfile.id)
      }
    };

    // Add cycle-specific recommendations
    if (features.cycle_phase === 'menstrual') {
      enhancedPlan.track = enhancedPlan.track || [];
      enhancedPlan.track.push('Monitor flow intensity and color');
      enhancedPlan.track.push('Track pain levels and location');
      
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Stay hydrated (2.5L water)');
      enhancedPlan.maintain.push('Consider iron-rich foods');
    }

    if (features.cycle_phase === 'ovulatory') {
      enhancedPlan.track = enhancedPlan.track || [];
      enhancedPlan.track.push('Monitor cervical mucus changes');
      enhancedPlan.track.push('Track libido changes');
      
      enhancedPlan.maintain = enhancedPlan.maintain || [];
      enhancedPlan.maintain.push('Maintain regular exercise routine');
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
      const result = await pool.query(
        'SELECT event_date FROM cycle_events WHERE user_id = $1 AND event_type = $2 ORDER BY event_date DESC LIMIT 1',
        [userId, 'period_start']
      );
      
      if (result.rows.length === 0) return null;
      
      const lastPeriodDate = new Date(result.rows[0].event_date);
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
      const result = await pool.query(
        'SELECT event_date FROM cycle_events WHERE user_id = $1 AND event_type = $2 ORDER BY event_date DESC LIMIT 10',
        [userId, 'period_start']
      );
      
      if (result.rows.length < 2) return 28;
      
      const dates = result.rows.map(row => new Date(row.event_date)).reverse();
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
      await pool.query(
        'INSERT INTO ai_outputs (user_id, agent_type, features, risk_score, plan, message, version) VALUES ($1, $2, $3, $4, $5, $6, $7)',
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

  async applyUIAdaptations(adaptations, userId) {
    for (const adaptation of adaptations) {
      try {
        // Store adaptation in database
        await pool.query(
          'INSERT INTO ui_adaptations (user_id, adaptation_type, target_component, changes) VALUES ($1, $2, $3, $4)',
          [userId, adaptation.type, adaptation.target, JSON.stringify(adaptation)]
        );

        // Publish to Redis for real-time UI updates
        await publishMessage('ui_adaptations', {
          user_id: userId,
          adaptation: adaptation,
          timestamp: new Date().toISOString()
        });

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