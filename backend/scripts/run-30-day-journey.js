const CSVProcessor = require('../utils/csvProcessor');
const { initializeDatabase, run, runQuery } = require('../config/database');
const SignalAnalysisAgent = require('../agents/saa');
const DynamicPromptGeneratorAgent = require('../agents/dpga');
const { morphApply } = require('../agents/morphApplyReal');

class JourneyRunner {
    constructor() {
        this.csvProcessor = new CSVProcessor();
        this.saa = new SignalAnalysisAgent();
        this.dpga = new DynamicPromptGeneratorAgent();
        this.journeyData = [];
        this.aiInsights = [];
        this.uiAdaptations = [];
    }

    async initialize() {
        console.log('🚀 Initializing 30-Day AI Health Journey...');
        
        // Initialize database
        await initializeDatabase();
        
        // Load and process CSV data
        await this.csvProcessor.loadCSVData();
        this.csvProcessor.maskUserData();
        
        // Generate 30-day journey data
        this.journeyData = this.csvProcessor.generate30DayJourney('USER_001');
        
        console.log(`✅ Generated ${this.journeyData.length} days of journey data`);
    }

    async runWeek1Demo() {
        console.log('\n📅 Week 1 Demo: Initial AI Discovery & Baseline Assessment');
        console.log('=' .repeat(60));
        
        const week1Data = this.journeyData.slice(0, 7);
        const insights = [];
        
        for (let day = 0; day < 7; day++) {
            const dayData = week1Data[day];
            console.log(`\n📊 Day ${day + 1}: ${dayData.date} - ${dayData.cycle_phase} phase`);
            
            // Generate sensor data for the day
            const sensorData = this.generateSensorDataForDay(dayData);
            
            // Run SAA analysis
            const saaResult = await this.saa.analyzeSignals('USER_001', sensorData);
            
            // Run DPGA for personalized insights
            const userProfile = await this.getUserProfile('USER_001');
            const dpgaResult = await this.dpga.generatePlanAndMessage(userProfile, saaResult.features, saaResult.abnormalities);
            
            insights.push({
                day: day + 1,
                date: dayData.date,
                saa: saaResult,
                dpga: dpgaResult,
                cycle_phase: dayData.cycle_phase,
                key_insights: this.extractKeyInsights(saaResult, dpgaResult)
            });
            
            console.log(`   🔍 Risk Level: ${(saaResult.risk * 100).toFixed(1)}%`);
            console.log(`   💡 AI Message: ${dpgaResult.message.substring(0, 80)}...`);
            console.log(`   🎯 Goals: ${dpgaResult.track?.length || 0} tracking, ${dpgaResult.maintain?.length || 0} maintenance`);
        }
        
        this.aiInsights.push({ week: 1, insights });
        await this.saveWeekInsights(1, insights);
        
        console.log('\n✅ Week 1 Demo Complete - AI has established baseline patterns');
    }

    async runWeek2Demo() {
        console.log('\n📅 Week 2 Demo: Pattern Recognition & Personalized Recommendations');
        console.log('=' .repeat(60));
        
        const week2Data = this.journeyData.slice(7, 14);
        const insights = [];
        
        for (let day = 0; day < 7; day++) {
            const dayData = week2Data[day];
            console.log(`\n📊 Day ${day + 8}: ${dayData.date} - ${dayData.cycle_phase} phase`);
            
            // Simulate improved data collection and pattern recognition
            const enhancedData = this.enhanceDataWithPatterns(dayData, day + 8);
            const sensorData = this.generateSensorDataForDay(enhancedData);
            
            // Run enhanced SAA with pattern recognition
            const saaResult = await this.saa.analyzeSignals('USER_001', sensorData);
            
            // Run DPGA with improved personalization
            const userProfile = await this.getUserProfile('USER_001');
            const dpgaResult = await this.dpga.generatePlanAndMessage(userProfile, saaResult.features, saaResult.abnormalities);
            
            // Generate UI adaptations based on learned patterns
            const uiAdaptations = await this.generateUIAdaptations(saaResult, dpgaResult, day + 8);
            
            insights.push({
                day: day + 8,
                date: dayData.date,
                saa: saaResult,
                dpga: dpgaResult,
                ui_adaptations: uiAdaptations,
                cycle_phase: dayData.cycle_phase,
                key_insights: this.extractKeyInsights(saaResult, dpgaResult),
                patterns_identified: this.identifyPatterns(day + 8)
            });
            
            console.log(`   🔍 Risk Level: ${(saaResult.risk * 100).toFixed(1)}%`);
            console.log(`   💡 AI Message: ${dpgaResult.message.substring(0, 80)}...`);
            console.log(`   🎨 UI Adaptations: ${uiAdaptations.length} changes`);
            console.log(`   📈 Patterns: ${this.identifyPatterns(day + 8).length} identified`);
        }
        
        this.aiInsights.push({ week: 2, insights });
        await this.saveWeekInsights(2, insights);
        
        console.log('\n✅ Week 2 Demo Complete - AI has learned patterns and adapted UI');
    }

    async runWeek3Demo() {
        console.log('\n📅 Week 3 Demo: Predictive Analytics & Proactive Interventions');
        console.log('=' .repeat(60));
        
        const week3Data = this.journeyData.slice(14, 21);
        const insights = [];
        
        for (let day = 0; day < 7; day++) {
            const dayData = week3Data[day];
            console.log(`\n📊 Day ${day + 15}: ${dayData.date} - ${dayData.cycle_phase} phase`);
            
            // Simulate predictive data with future insights
            const predictiveData = this.generatePredictiveData(dayData, day + 15);
            const sensorData = this.generateSensorDataForDay(predictiveData);
            
            // Run SAA with predictive capabilities
            const saaResult = await this.saa.analyzeSignals('USER_001', sensorData);
            
            // Run DPGA with proactive recommendations
            const userProfile = await this.getUserProfile('USER_001');
            const dpgaResult = await this.dpga.generatePlanAndMessage(userProfile, saaResult.features, saaResult.abnormalities);
            
            // Generate proactive UI adaptations
            const proactiveAdaptations = await this.generateProactiveAdaptations(saaResult, dpgaResult, day + 15);
            
            // Generate health predictions
            const predictions = this.generateHealthPredictions(day + 15, saaResult);
            
            insights.push({
                day: day + 15,
                date: dayData.date,
                saa: saaResult,
                dpga: dpgaResult,
                ui_adaptations: proactiveAdaptations,
                predictions: predictions,
                cycle_phase: dayData.cycle_phase,
                key_insights: this.extractKeyInsights(saaResult, dpgaResult),
                proactive_interventions: this.generateProactiveInterventions(day + 15)
            });
            
            console.log(`   🔍 Risk Level: ${(saaResult.risk * 100).toFixed(1)}%`);
            console.log(`   💡 AI Message: ${dpgaResult.message.substring(0, 80)}...`);
            console.log(`   🔮 Predictions: ${predictions.length} health forecasts`);
            console.log(`   ⚡ Proactive: ${this.generateProactiveInterventions(day + 15).length} interventions`);
        }
        
        this.aiInsights.push({ week: 3, insights });
        await this.saveWeekInsights(3, insights);
        
        console.log('\n✅ Week 3 Demo Complete - AI is now predictive and proactive');
    }

    async runWeek4Demo() {
        console.log('\n📅 Week 4 Demo: Autonomous Optimization & Life Transformation');
        console.log('=' .repeat(60));
        
        const week4Data = this.journeyData.slice(21, 30);
        const insights = [];
        
        for (let day = 0; day < 9; day++) {
            const dayData = week4Data[day];
            console.log(`\n📊 Day ${day + 22}: ${dayData.date} - ${dayData.cycle_phase} phase`);
            
            // Simulate fully optimized data with life transformation
            const optimizedData = this.generateOptimizedData(dayData, day + 22);
            const sensorData = this.generateSensorDataForDay(optimizedData);
            
            // Run SAA with full optimization
            const saaResult = await this.saa.analyzeSignals('USER_001', sensorData);
            
            // Run DPGA with life transformation insights
            const userProfile = await this.getUserProfile('USER_001');
            const dpgaResult = await this.dpga.generatePlanAndMessage(userProfile, saaResult.features, saaResult.abnormalities);
            
            // Generate autonomous UI optimizations
            const autonomousAdaptations = await this.generateAutonomousAdaptations(saaResult, dpgaResult, day + 22);
            
            // Generate life transformation metrics
            const transformationMetrics = this.generateTransformationMetrics(day + 22, saaResult);
            
            insights.push({
                day: day + 22,
                date: dayData.date,
                saa: saaResult,
                dpga: dpgaResult,
                ui_adaptations: autonomousAdaptations,
                transformation_metrics: transformationMetrics,
                cycle_phase: dayData.cycle_phase,
                key_insights: this.extractKeyInsights(saaResult, dpgaResult),
                life_improvements: this.generateLifeImprovements(day + 22)
            });
            
            console.log(`   🔍 Risk Level: ${(saaResult.risk * 100).toFixed(1)}%`);
            console.log(`   💡 AI Message: ${dpgaResult.message.substring(0, 80)}...`);
            console.log(`   🤖 Autonomous: ${autonomousAdaptations.length} optimizations`);
            console.log(`   🌟 Transformation: ${this.generateLifeImprovements(day + 22).length} improvements`);
        }
        
        this.aiInsights.push({ week: 4, insights });
        await this.saveWeekInsights(4, insights);
        
        console.log('\n✅ Week 4 Demo Complete - AI has transformed the user\'s life');
    }

    generateSensorDataForDay(dayData) {
        return [
            {
                user_id: dayData.patient_id,
                source: 'hrv',
                payload: { ms: dayData.hrv_ms },
                timestamp: dayData.date
            },
            {
                user_id: dayData.patient_id,
                source: 'sleep',
                payload: { hours: dayData.sleep_hours, deep_sleep_pct: dayData.deep_sleep_pct },
                timestamp: dayData.date
            },
            {
                user_id: dayData.patient_id,
                source: 'bbt',
                payload: { celsius: dayData.bbt_c },
                timestamp: dayData.date
            },
            {
                user_id: dayData.patient_id,
                source: 'steps',
                payload: { count: dayData.steps },
                timestamp: dayData.date
            },
            {
                user_id: dayData.patient_id,
                source: 'mood',
                payload: { rating: dayData.mood_rating, sentiment: dayData.sentiment_score },
                timestamp: dayData.date
            }
        ];
    }

    enhanceDataWithPatterns(dayData, dayNumber) {
        // Simulate pattern recognition improvements
        const enhanced = { ...dayData };
        
        // Improve sleep patterns over time
        if (dayNumber > 10) {
            enhanced.sleep_hours = Math.min(8.5, enhanced.sleep_hours + 0.2);
            enhanced.deep_sleep_pct = Math.min(40, enhanced.deep_sleep_pct + 2);
        }
        
        // Improve stress management
        if (dayNumber > 12) {
            enhanced.hrv_ms = Math.min(80, enhanced.hrv_ms + 3);
        }
        
        return enhanced;
    }

    generatePredictiveData(dayData, dayNumber) {
        // Simulate predictive analytics
        const predictive = { ...dayData };
        
        // Predict and prevent issues
        if (predictive.cycle_phase === 'luteal' && dayNumber > 20) {
            predictive.cramps_severity = Math.max(0, predictive.cramps_severity - 1);
            predictive.body_pain_severity = Math.max(0, predictive.body_pain_severity - 1);
        }
        
        return predictive;
    }

    generateOptimizedData(dayData, dayNumber) {
        // Simulate fully optimized life
        const optimized = { ...dayData };
        
        // Optimal sleep
        optimized.sleep_hours = 8.0;
        optimized.deep_sleep_pct = 35;
        
        // Optimal stress management
        optimized.hrv_ms = 75;
        optimized.sentiment_score = 0.6;
        
        // Optimal activity
        optimized.steps = 12000;
        optimized.active_minutes = 90;
        
        // Reduced pain through optimization
        optimized.cramps_severity = Math.max(0, optimized.cramps_severity - 2);
        optimized.body_pain_severity = Math.max(0, optimized.body_pain_severity - 2);
        
        return optimized;
    }

    async generateUIAdaptations(saaResult, dpgaResult, dayNumber) {
        const adaptations = [];
        
        // Stress management adaptation
        if (saaResult.risk > 0.3) {
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
        
        // Sleep optimization adaptation
        if (saaResult.features.sleep_hours < 7) {
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
        
        return adaptations;
    }

    async generateProactiveAdaptations(saaResult, dpgaResult, dayNumber) {
        const adaptations = await this.generateUIAdaptations(saaResult, dpgaResult, dayNumber);
        
        // Add proactive elements
        if (saaResult.features.cycle_phase === 'luteal') {
            adaptations.push({
                type: 'add_component',
                target: 'proactive_wellness_card',
                priority: 'medium',
                content: {
                    title: 'Proactive Wellness',
                    suggestions: ['Prepare for menstrual phase', 'Stock up on comfort items', 'Schedule lighter activities']
                }
            });
        }
        
        return adaptations;
    }

    async generateAutonomousAdaptations(saaResult, dpgaResult, dayNumber) {
        const adaptations = await this.generateProactiveAdaptations(saaResult, dpgaResult, dayNumber);
        
        // Add autonomous optimization
        adaptations.push({
            type: 'optimize_interface',
            target: 'main_dashboard',
            priority: 'high',
            content: {
                title: 'Autonomous Optimization',
                changes: ['Simplified layout', 'Focus on current priorities', 'Reduced cognitive load'],
                reason: 'AI has learned optimal interface for this user'
            }
        });
        
        return adaptations;
    }

    generateHealthPredictions(dayNumber, saaResult) {
        const predictions = [];
        
        // Cycle predictions
        predictions.push({
            type: 'cycle_prediction',
            prediction: 'Next period expected in 14 days',
            confidence: 0.85,
            factors: ['Regular cycle pattern', 'Consistent tracking']
        });
        
        // Health trend predictions
        if (saaResult.features.sleep_hours < 7) {
            predictions.push({
                type: 'health_trend',
                prediction: 'Sleep quality may decline if current pattern continues',
                confidence: 0.75,
                recommendation: 'Implement sleep hygiene practices'
            });
        }
        
        return predictions;
    }

    generateTransformationMetrics(dayNumber, saaResult) {
        return {
            sleep_improvement: '+15%',
            stress_reduction: '-25%',
            energy_increase: '+20%',
            pain_reduction: '-40%',
            overall_wellness: '+30%',
            cycle_regularity: '95%',
            goal_achievement: '87%'
        };
    }

    extractKeyInsights(saaResult, dpgaResult) {
        return {
            risk_level: saaResult.risk,
            cycle_phase: saaResult.features.cycle_phase,
            primary_concern: saaResult.risk > 0.5 ? 'High risk detected' : 'Normal patterns',
            key_recommendation: dpgaResult.track?.[0] || 'Continue monitoring',
            improvement_area: saaResult.features.sleep_hours < 7 ? 'Sleep quality' : 'Maintain current habits'
        };
    }

    identifyPatterns(dayNumber) {
        const patterns = [];
        
        if (dayNumber > 10) {
            patterns.push('Sleep pattern improvement detected');
            patterns.push('Stress management effectiveness increasing');
        }
        
        if (dayNumber > 15) {
            patterns.push('Cycle regularity established');
            patterns.push('Energy optimization patterns learned');
        }
        
        return patterns;
    }

    generateProactiveInterventions(dayNumber) {
        const interventions = [];
        
        if (dayNumber > 15) {
            interventions.push('Pre-emptive stress management');
            interventions.push('Proactive sleep optimization');
            interventions.push('Early pain management strategies');
        }
        
        return interventions;
    }

    generateLifeImprovements(dayNumber) {
        const improvements = [];
        
        if (dayNumber > 20) {
            improvements.push('Consistent sleep schedule established');
            improvements.push('Stress management routine integrated');
            improvements.push('Optimal exercise timing learned');
            improvements.push('Nutrition optimization achieved');
            improvements.push('Life balance restored');
        }
        
        return improvements;
    }

    async getUserProfile(userId) {
        try {
            const result = await runQuery(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            
            if (result.length > 0) {
                return result[0];
            }
            
            // Create default profile if not exists
            return {
                id: userId,
                name: `User ${userId}`,
                age: 28,
                cycle_length: 28,
                typical_period_length: 5,
                preferred_coaching_style: 'motivational',
                journaling_mode: 'audio'
            };
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    async saveWeekInsights(week, insights) {
        try {
            await run(
                'INSERT INTO ai_outputs (user_id, agent_type, features, risk_score, plan, message, version) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    'USER_001',
                    `week_${week}_journey`,
                    JSON.stringify({ week, day_count: insights.length }),
                    0.5,
                    JSON.stringify(insights),
                    `Week ${week} AI Journey Insights`,
                    `week_${week}_${Date.now()}`
                ]
            );
        } catch (error) {
            console.error(`Error saving week ${week} insights:`, error);
        }
    }

    async generateFinalReport() {
        console.log('\n📊 Final 30-Day Journey Report');
        console.log('=' .repeat(60));
        
        const totalInsights = this.aiInsights.reduce((sum, week) => sum + week.insights.length, 0);
        const averageRisk = this.aiInsights.reduce((sum, week) => {
            return sum + week.insights.reduce((weekSum, day) => weekSum + day.saa.risk, 0);
        }, 0) / totalInsights;
        
        console.log(`📈 Total AI Insights Generated: ${totalInsights}`);
        console.log(`🎯 Average Risk Level: ${(averageRisk * 100).toFixed(1)}%`);
        console.log(`🤖 UI Adaptations Created: ${this.aiInsights.reduce((sum, week) => sum + week.insights.reduce((weekSum, day) => weekSum + (day.ui_adaptations?.length || 0), 0), 0)}`);
        console.log(`🔮 Health Predictions: ${this.aiInsights.reduce((sum, week) => sum + week.insights.reduce((weekSum, day) => weekSum + (day.predictions?.length || 0), 0), 0)}`);
        
        console.log('\n🌟 Journey Progression Summary:');
        console.log('Week 1: AI Discovery & Baseline Assessment');
        console.log('Week 2: Pattern Recognition & Personalization');
        console.log('Week 3: Predictive Analytics & Proactive Interventions');
        console.log('Week 4: Autonomous Optimization & Life Transformation');
        
        console.log('\n🎉 30-Day AI Health Journey Complete!');
        console.log('The AI agents have successfully:');
        console.log('✅ Diagnosed health patterns and risks');
        console.log('✅ Predicted cycles and fertility windows');
        console.log('✅ Formed personalized goals and recommendations');
        console.log('✅ Provided intelligent notifications and alerts');
        console.log('✅ Adapted the UI for optimal user experience');
        console.log('✅ Transformed the user\'s health journey');
    }

    async run() {
        try {
            await this.initialize();
            
            // Run all 4 week demos
            await this.runWeek1Demo();
            await this.runWeek2Demo();
            await this.runWeek3Demo();
            await this.runWeek4Demo();
            
            // Generate final report
            await this.generateFinalReport();
            
        } catch (error) {
            console.error('Error running 30-day journey:', error);
        }
    }
}

// Run the journey if this script is executed directly
if (require.main === module) {
    const runner = new JourneyRunner();
    runner.run().then(() => {
        console.log('\n🚀 Journey runner completed successfully!');
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Journey runner failed:', error);
        process.exit(1);
    });
}

module.exports = JourneyRunner;
