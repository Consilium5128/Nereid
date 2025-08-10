# Quick Test Guide - AI Agent Integration

## 🚀 Immediate Testing Steps

### 1. Verify Backend is Running
```bash
curl http://localhost:3000/health
```
**Expected Response**: `{"status":"healthy","timestamp":"...","version":"1.0.0"}`

### 2. Test Health Analysis
```bash
curl -X POST http://localhost:3000/api/health/analyze/P900
```
**Expected Response**: Complete health profile with cycle predictions and insights

### 3. Test Demo Summary
```bash
curl -X GET http://localhost:3000/api/demos/summary
```
**Expected Response**: 4-week demo progression summary with metrics

### 4. Test Cycle Predictions
```bash
curl -X GET "http://localhost:3000/api/health/predictions/P900?days=30"
```
**Expected Response**: 30-day cycle predictions with confidence scores

### 5. Test Health Insights
```bash
curl -X GET http://localhost:3000/api/health/insights/P900
```
**Expected Response**: Personalized health recommendations and goals

## 📱 SwiftUI App Testing

### 1. Open Xcode Project
```bash
open Nerea/Nerea.xcodeproj
```

### 2. Build and Run
- Select your target device/simulator
- Press Cmd+R to build and run
- The app will automatically load health data for user P900

### 3. Test AI Features
- **Onboarding**: Should show personalized cycle data
- **Home Dashboard**: Should display AI insights and predictions
- **AI Insights**: Should show health recommendations
- **Goals**: Should display personalized goals
- **Predictions**: Should show cycle predictions

## 📊 Demo Data Verification

### Check Generated Files
```bash
ls -la backend/data/demos/
ls -la backend/data/user_profiles/
ls -la backend/data/adapted_ui/
```

### View Demo Summary
```bash
cat backend/data/demos/demo_summary.json
```

### View User Profile
```bash
cat backend/data/user_profiles/P900_profile.json
```

## 🔍 Key Test Points

### Health Analysis Results
- ✅ User P900 profile created
- ✅ Cycle predictions generated (95% confidence)
- ✅ Health insights personalized
- ✅ Goals created based on data

### UI Adaptation Results
- ✅ SwiftUI templates loaded
- ✅ UI adaptations generated
- ✅ Color schemes personalized
- ✅ Layout density adjusted

### Demo Progression
- ✅ Week 1: Initial assessment (33% progress)
- ✅ Week 2: Pattern recognition (33% progress)
- ✅ Week 3: Improvements (67% progress)
- ✅ Week 4: Mastery (100% progress)

## 🎯 Expected Outcomes

### API Responses
- All endpoints should return `{"success": true, ...}`
- Health analysis should include comprehensive user profile
- Cycle predictions should show 30-day forecasts
- Demo summary should show 4-week progression

### SwiftUI Integration
- App should load without errors
- AI insights should display in relevant views
- Health data should be personalized for user P900
- UI should adapt based on user profile

### Demo Data
- 4 weekly demo files should be generated
- User profile should be comprehensive
- UI adaptations should be personalized
- Progress should show improvement over time

## 🚨 Troubleshooting

### If Backend Won't Start
```bash
cd backend
npm install
node index.js
```

### If APIs Return Errors
```bash
# Check if server is running
curl http://localhost:3000/health

# Check server logs
# Look for error messages in terminal
```

### If SwiftUI Won't Build
- Check that all new files are included in the Xcode project
- Verify NetworkService.swift has all new methods
- Ensure AppState.swift has new AI integration methods

### If Demo Data Missing
```bash
# Regenerate demos
node run_demos.js
```

## 🎉 Success Indicators

### ✅ Backend Running
- Health endpoint responds
- All API endpoints accessible
- Database initialized

### ✅ Demo Data Generated
- 4 weekly demo files created
- User profile comprehensive
- UI adaptations personalized

### ✅ SwiftUI Integration
- App builds successfully
- AI features load properly
- Health data displays correctly

### ✅ API Integration
- All endpoints return success
- Data flows correctly
- Real-time updates work

## 📈 Performance Metrics

### Expected Results
- **Health Analysis**: < 2 seconds response time
- **Cycle Predictions**: 95% confidence for regular cycles
- **UI Adaptations**: 28 adaptations generated
- **Demo Generation**: 4 weeks of progression data
- **Improvement Rate**: 203% from week 1 to week 4

### Success Criteria
- ✅ All APIs respond within 5 seconds
- ✅ Health analysis includes all data fields
- ✅ Cycle predictions are accurate
- ✅ UI adaptations are personalized
- ✅ Demo progression shows improvement

## 🎯 Next Steps After Testing

1. **Explore the App**: Navigate through all views to see AI insights
2. **Test Different Users**: Add more users to CSV for testing
3. **Enhance UI**: Refine UI adaptations based on testing
4. **Add Features**: Extend with notifications, more insights
5. **Scale Up**: Test with larger datasets

## 📞 Support

If you encounter any issues:
1. Check the server logs for error messages
2. Verify all files are in the correct locations
3. Ensure all dependencies are installed
4. Test individual API endpoints
5. Review the comprehensive summary document

**Status**: ✅ **READY FOR TESTING**
