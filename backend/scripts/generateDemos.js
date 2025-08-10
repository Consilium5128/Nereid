// scripts/generateDemos.js
const { HealthAnalysisAgent } = require('../agents/healthAnalysisAgent');
const { UIMorphAgent } = require('../agents/uiMorphAgent');
const fs = require('fs');
const path = require('path');

class DemoGenerator {
  constructor() {
    this.healthAgent = new HealthAnalysisAgent();
    this.uiAgent = new UIMorphAgent();
    this.demoData = new Map();
  }

  async initialize() {
    console.log('Initializing Demo Generator...');
    
    // Load CSV data
    await this.healthAgent.loadCSVData();
    
    // Load SwiftUI templates
    await this.uiAgent.loadSwiftUITemplates();
    
    // Create output directories
    this.createOutputDirectories();
    
    console.log('Demo Generator initialized successfully');
  }

  createOutputDirectories() {
    const dirs = [
      'data/demos',
      'data/adapted_ui',
      'data/weekly_progress',
      'data/user_profiles'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  async generateUserProfiles() {
    console.log('Generating user profiles from CSV data...');
    
    const userIds = [...new Set(this.healthAgent.csvData.map(row => row.patient_id))];
    const profiles = [];

    for (const userId of userIds) {
      try {
        const profile = await this.healthAgent.analyzeUserProfile(userId);
        const cyclePredictions = await this.healthAgent.predictNextCycles(userId, 30);
        const healthInsights = await this.healthAgent.generateHealthInsights(userId);
        
        // Save profile data
        const profileData = {
          userId,
          profile,
          cyclePredictions,
          healthInsights,
          timestamp: new Date().toISOString()
        };

        const profilePath = path.join(__dirname, `../data/user_profiles/${userId}_profile.json`);
        fs.writeFileSync(profilePath, JSON.stringify(profileData, null, 2));
        
        profiles.push(profileData);
        console.log(`Generated profile for user ${userId}`);
      } catch (error) {
        console.error(`Error generating profile for user ${userId}:`, error);
      }
    }

    return profiles;
  }

  async generateWeeklyDemos(userProfiles) {
    console.log('Generating 4-week demo progression...');
    
    const weeklyDemos = [];

    for (const userData of userProfiles) {
      const { userId, profile, healthInsights } = userData;
      
      console.log(`Generating demos for user ${userId}...`);
      
      for (let week = 1; week <= 4; week++) {
        try {
          // Simulate progression by modifying insights based on week
          const progressiveInsights = this.simulateWeeklyProgression(healthInsights, week);
          
          // Generate UI adaptations for this week
          const uiAdaptations = await this.uiAgent.adaptUIForUser(userId, profile, progressiveInsights);
          
          // Generate weekly demo data
          const demoData = await this.uiAgent.createWeeklyDemo(userId, week, profile, progressiveInsights);
          
          // Add UI adaptations to demo data
          demoData.uiAdaptations = uiAdaptations;
          
          // Save demo data
          const demoPath = path.join(__dirname, `../data/demos/week_${week}_${userId}.json`);
          fs.writeFileSync(demoPath, JSON.stringify(demoData, null, 2));
          
          weeklyDemos.push(demoData);
          console.log(`Generated week ${week} demo for user ${userId}`);
          
        } catch (error) {
          console.error(`Error generating week ${week} demo for user ${userId}:`, error);
        }
      }
    }

    return weeklyDemos;
  }

  simulateWeeklyProgression(originalInsights, week) {
    const progressiveInsights = JSON.parse(JSON.stringify(originalInsights));
    
    // Simulate improvements in health metrics over weeks
    const improvementFactor = Math.min(week * 0.25, 1.0); // 25% improvement per week, max 100%
    
    // Update cycle insights
    progressiveInsights.cycleInsights = progressiveInsights.cycleInsights.map(insight => {
      if (insight.priority === 'high' && week > 1) {
        return {
          ...insight,
          priority: week > 2 ? 'medium' : 'high',
          message: week > 2 ? 
            'Your cycle pattern is showing improvement. Continue tracking for better predictions.' :
            insight.message
        };
      }
      return insight;
    });

    // Update health recommendations
    progressiveInsights.healthInsights = progressiveInsights.healthInsights.map(rec => {
      if (rec.category === 'sleep' && week > 1) {
        return {
          ...rec,
          description: week > 2 ? 
            'Great progress on sleep! Your sleep quality has improved significantly.' :
            'You\'re making good progress on sleep optimization. Keep it up!',
          actionable: week < 4
        };
      }
      if (rec.category === 'activity' && week > 1) {
        return {
          ...rec,
          description: week > 2 ? 
            'Excellent activity levels! You\'ve consistently met your step goals.' :
            'Your activity levels are improving. You\'re on the right track!',
          actionable: week < 4
        };
      }
      return rec;
    });

    // Update lifestyle recommendations
    progressiveInsights.lifestyleInsights = progressiveInsights.lifestyleInsights.map(rec => {
      if (rec.category === 'stress' && week > 1) {
        return {
          ...rec,
          description: week > 2 ? 
            'Your stress management techniques are working well. You\'ve shown significant improvement.' :
            'You\'re making good progress with stress management. Continue practicing these techniques.',
          actionable: week < 4
        };
      }
      return rec;
    });

    // Update goals based on progress
    progressiveInsights.goals = progressiveInsights.goals.map(goal => {
      const progress = Math.min(week * 25, 100); // 25% progress per week
      return {
        ...goal,
        progress: progress,
        status: progress >= 100 ? 'completed' : progress >= 50 ? 'in_progress' : 'not_started',
        current: this.updateGoalCurrent(goal, week)
      };
    });

    // Update notifications based on progress
    progressiveInsights.notifications = progressiveInsights.notifications.map(notification => {
      if (week > 2) {
        return {
          ...notification,
          body: 'Great progress! Keep up the excellent work with your health goals.',
          frequency: 'weekly' // Reduce frequency as user improves
        };
      }
      return notification;
    });

    return progressiveInsights;
  }

  updateGoalCurrent(goal, week) {
    switch (goal.category) {
      case 'sleep':
        const baseHours = parseFloat(goal.current.split(' ')[0]);
        const improvedHours = Math.min(baseHours + (week * 0.5), 8);
        return `${improvedHours.toFixed(1)} hours`;
      
      case 'activity':
        const baseSteps = parseInt(goal.current.split(' ')[0]);
        const improvedSteps = Math.min(baseSteps + (week * 500), 10000);
        return `${improvedSteps} steps`;
      
      case 'stress':
        const stressLevels = ['High stress level', 'Moderate stress level', 'Low stress level'];
        const stressIndex = Math.min(week, 2);
        return stressLevels[stressIndex];
      
      default:
        return goal.current;
    }
  }

  async generateDemoSummary() {
    console.log('Generating demo summary...');
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalUsers: 0,
      totalDemos: 0,
      weeklyBreakdown: {},
      keyMetrics: {},
      insights: []
    };

    // Read all demo files
    const demosDir = path.join(__dirname, '../data/demos');
    const demoFiles = fs.readdirSync(demosDir).filter(file => file.endsWith('.json'));
    
    const userIds = new Set();
    const weeklyData = { 1: [], 2: [], 3: [], 4: [] };

    for (const file of demoFiles) {
      const demoPath = path.join(demosDir, file);
      const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
      
      userIds.add(demoData.userId);
      weeklyData[demoData.week].push(demoData);
    }

    summary.totalUsers = userIds.size;
    summary.totalDemos = demoFiles.length;

    // Generate weekly breakdown
    for (let week = 1; week <= 4; week++) {
      const weekData = weeklyData[week];
      summary.weeklyBreakdown[week] = {
        demos: weekData.length,
        users: new Set(weekData.map(d => d.userId)).size,
        averageProgress: this.calculateAverageProgress(weekData),
        commonInsights: this.extractCommonInsights(weekData)
      };
    }

    // Generate key metrics
    summary.keyMetrics = this.calculateKeyMetrics(weeklyData);

    // Generate insights
    summary.insights = this.generateDemoInsights(weeklyData);

    // Save summary
    const summaryPath = path.join(__dirname, '../data/demos/demo_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('Demo summary generated successfully');
    return summary;
  }

  calculateAverageProgress(weekData) {
    if (weekData.length === 0) return 0;
    
    const totalProgress = weekData.reduce((sum, demo) => {
      const completedGoals = demo.progress.goals.filter(g => g.status === 'completed').length;
      const totalGoals = demo.progress.goals.length;
      return sum + (totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0);
    }, 0);
    
    return Math.round(totalProgress / weekData.length);
  }

  extractCommonInsights(weekData) {
    const insights = [];
    
    // Count common health insights
    const healthInsightCounts = {};
    weekData.forEach(demo => {
      demo.insights.healthInsights.forEach(insight => {
        const key = insight.category;
        healthInsightCounts[key] = (healthInsightCounts[key] || 0) + 1;
      });
    });

    // Get top 3 most common insights
    const sortedInsights = Object.entries(healthInsightCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));

    return sortedInsights;
  }

  calculateKeyMetrics(weeklyData) {
    const metrics = {
      totalCyclePredictions: 0,
      totalHealthInsights: 0,
      totalUIAdaptations: 0,
      averageConfidence: 0,
      improvementRate: 0
    };

    let totalConfidence = 0;
    let totalDemos = 0;

    for (let week = 1; week <= 4; week++) {
      const weekData = weeklyData[week];
      weekData.forEach(demo => {
        metrics.totalCyclePredictions += demo.profile.cyclePattern ? 1 : 0;
        metrics.totalHealthInsights += demo.insights.healthInsights.length;
        metrics.totalUIAdaptations += demo.uiAdaptations.adaptations.length;
        
        if (demo.profile.cyclePattern) {
          totalConfidence += demo.profile.cyclePattern.regularity === 'regular' ? 0.85 : 0.55;
        }
        
        totalDemos++;
      });
    }

    metrics.averageConfidence = totalDemos > 0 ? Math.round((totalConfidence / totalDemos) * 100) : 0;
    
    // Calculate improvement rate (comparing week 1 to week 4)
    const week1Data = weeklyData[1];
    const week4Data = weeklyData[4];
    
    if (week1Data.length > 0 && week4Data.length > 0) {
      const week1Progress = this.calculateAverageProgress(week1Data);
      const week4Progress = this.calculateAverageProgress(week4Data);
      metrics.improvementRate = week1Progress > 0 ? Math.round(((week4Progress - week1Progress) / week1Progress) * 100) : 0;
    }

    return metrics;
  }

  generateDemoInsights(weeklyData) {
    const insights = [];

    // Week 1 insights
    if (weeklyData[1].length > 0) {
      insights.push({
        week: 1,
        title: "Initial Assessment & Setup",
        description: "Users begin their journey with comprehensive health analysis and personalized goal setting",
        keyFindings: [
          "Average cycle regularity assessment completed",
          "Personalized health recommendations generated",
          "Initial UI adaptations applied based on user profile"
        ]
      });
    }

    // Week 2 insights
    if (weeklyData[2].length > 0) {
      insights.push({
        week: 2,
        title: "Pattern Recognition & Early Progress",
        description: "AI agents begin recognizing patterns and users show early signs of improvement",
        keyFindings: [
          "Cycle prediction accuracy improves with more data",
          "Users show 25% improvement in goal completion",
          "UI adaptations become more refined based on usage patterns"
        ]
      });
    }

    // Week 3 insights
    if (weeklyData[3].length > 0) {
      insights.push({
        week: 3,
        title: "Significant Improvements & Optimization",
        description: "Users demonstrate significant health improvements and AI recommendations become more targeted",
        keyFindings: [
          "75% of users show measurable health improvements",
          "AI recommendations shift from basic to advanced optimization",
          "UI becomes highly personalized and focused"
        ]
      });
    }

    // Week 4 insights
    if (weeklyData[4].length > 0) {
      insights.push({
        week: 4,
        title: "Mastery & Long-term Success",
        description: "Users achieve their health goals and establish sustainable habits",
        keyFindings: [
          "90% of users complete their primary health goals",
          "AI system demonstrates high prediction accuracy",
          "Personalized UI adaptations show significant user engagement improvements"
        ]
      });
    }

    return insights;
  }

  async run() {
    try {
      console.log('Starting Demo Generation Process...');
      
      // Initialize
      await this.initialize();
      
      // Generate user profiles
      const userProfiles = await this.generateUserProfiles();
      console.log(`Generated ${userProfiles.length} user profiles`);
      
      // Generate weekly demos
      const weeklyDemos = await this.generateWeeklyDemos(userProfiles);
      console.log(`Generated ${weeklyDemos.length} weekly demos`);
      
      // Generate summary
      const summary = await this.generateDemoSummary();
      
      console.log('\n=== DEMO GENERATION COMPLETE ===');
      console.log(`Total Users: ${summary.totalUsers}`);
      console.log(`Total Demos: ${summary.totalDemos}`);
      console.log(`Key Metrics:`);
      console.log(`  - Cycle Predictions: ${summary.keyMetrics.totalCyclePredictions}`);
      console.log(`  - Health Insights: ${summary.keyMetrics.totalHealthInsights}`);
      console.log(`  - UI Adaptations: ${summary.keyMetrics.totalUIAdaptations}`);
      console.log(`  - Average Confidence: ${summary.keyMetrics.averageConfidence}%`);
      console.log(`  - Improvement Rate: ${summary.keyMetrics.improvementRate}%`);
      
      return {
        success: true,
        userProfiles,
        weeklyDemos,
        summary
      };
      
    } catch (error) {
      console.error('Error in demo generation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the demo generator if this script is executed directly
if (require.main === module) {
  const generator = new DemoGenerator();
  generator.run().then(result => {
    if (result.success) {
      console.log('\nDemo generation completed successfully!');
      process.exit(0);
    } else {
      console.error('\nDemo generation failed:', result.error);
      process.exit(1);
    }
  });
}

module.exports = { DemoGenerator };
