#!/usr/bin/env node

// run_demos.js - Run the complete demo generation process
const { DemoGenerator } = require('./backend/scripts/generateDemos');
const { spawn } = require('child_process');
const path = require('path');

async function runDemos() {
    console.log('🚀 Starting Nereid AI Agent Demo Generation...\n');
    
    try {
        // Step 1: Generate demos
        console.log('📊 Step 1: Generating 4-week demo progression...');
        const generator = new DemoGenerator();
        const result = await generator.run();
        
        if (!result.success) {
            throw new Error(`Demo generation failed: ${result.error}`);
        }
        
        console.log('\n✅ Demo generation completed successfully!');
        console.log(`📈 Generated ${result.userProfiles.length} user profiles`);
        console.log(`📅 Generated ${result.weeklyDemos.length} weekly demos`);
        console.log(`📊 Summary: ${result.summary.totalUsers} users, ${result.summary.totalDemos} demos`);
        
        // Step 2: Start backend server
        console.log('\n🌐 Step 2: Starting backend server...');
        const serverProcess = spawn('node', ['backend/index.js'], {
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        serverProcess.on('error', (error) => {
            console.error('❌ Failed to start backend server:', error);
            process.exit(1);
        });
        
        // Step 3: Provide instructions
        console.log('\n🎯 Demo Generation Complete!');
        console.log('\n📋 What was generated:');
        console.log('   • 4-week progression demos showing AI agent improvements');
        console.log('   • Personalized health insights based on CSV data');
        console.log('   • UI adaptations for different user profiles');
        console.log('   • Cycle predictions for the next 30 days');
        console.log('   • Personalized goals and notifications');
        
        console.log('\n📁 Generated files:');
        console.log('   • backend/data/demos/ - Weekly demo data');
        console.log('   • backend/data/user_profiles/ - User health profiles');
        console.log('   • backend/data/adapted_ui/ - Personalized UI adaptations');
        console.log('   • backend/data/demos/demo_summary.json - Summary report');
        
        console.log('\n🔗 API Endpoints available:');
        console.log('   • POST /api/health/analyze/:userId - Full health analysis');
        console.log('   • GET /api/health/profile/:userId - User health profile');
        console.log('   • GET /api/health/predictions/:userId - Cycle predictions');
        console.log('   • GET /api/health/insights/:userId - Health insights');
        console.log('   • POST /api/ui/adapt/:userId - UI adaptations');
        console.log('   • GET /api/ui/notifications/:userId - Personalized notifications');
        console.log('   • GET /api/demos/summary - Demo summary');
        
        console.log('\n📱 SwiftUI Integration:');
        console.log('   • Updated AppState with new AI agent methods');
        console.log('   • Enhanced NetworkService with health analysis APIs');
        console.log('   • Integrated UI adaptation system');
        
        console.log('\n🎮 Next steps:');
        console.log('   1. Open the SwiftUI app in Xcode');
        console.log('   2. Build and run the app');
        console.log('   3. The app will automatically load health data for user P900');
        console.log('   4. Navigate through different views to see AI insights');
        console.log('   5. Check the demo files to see the 4-week progression');
        
        console.log('\n🔍 Key Features Demonstrated:');
        console.log('   • AI-powered health diagnosis and cycle prediction');
        console.log('   • Personalized goal setting and tracking');
        console.log('   • Intelligent UI adaptations based on user needs');
        console.log('   • Progressive improvement over 4 weeks');
        console.log('   • Autonomous agent behavior modification');
        
        console.log('\n✨ The AI agent system now provides:');
        console.log('   • Comprehensive health analysis from CSV data');
        console.log('   • 30-day cycle predictions with confidence scores');
        console.log('   • Personalized recommendations based on conditions');
        console.log('   • UI adaptations for different user profiles');
        console.log('   • Progressive goal achievement tracking');
        console.log('   • Intelligent notification scheduling');
        
        console.log('\n🎉 Demo system is ready! Backend server is running on http://localhost:3000');
        console.log('Press Ctrl+C to stop the server when done.\n');
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down...');
            serverProcess.kill();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Error running demos:', error);
        process.exit(1);
    }
}

// Run the demo generation
runDemos();
