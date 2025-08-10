// agents/uiMorphAgent.js
const { morphApply } = require('./morphApplyReal');
const fs = require('fs');
const path = require('path');

class UIMorphAgent {
  constructor() {
    this.swiftUITemplates = new Map();
    this.userPreferences = new Map();
    this.adaptationHistory = new Map();
  }

  async loadSwiftUITemplates() {
    const templatesDir = path.join(__dirname, '../../Nerea/Nerea/NereidDemo/Views');
    const files = fs.readdirSync(templatesDir);
    
    for (const file of files) {
      if (file.endsWith('.swift')) {
        const filePath = path.join(templatesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        this.swiftUITemplates.set(file, content);
      }
    }
    
    console.log(`Loaded ${this.swiftUITemplates.size} SwiftUI templates`);
  }

  async adaptUIForUser(userId, userProfile, healthInsights) {
    console.log(`Adapting UI for user ${userId}`);
    
    const adaptations = {
      userId,
      timestamp: new Date().toISOString(),
      adaptations: []
    };

    // Determine UI adaptations based on user profile and health insights
    const uiAdaptations = this.determineUIAdaptations(userProfile, healthInsights);
    
    // Apply adaptations to each SwiftUI file
    for (const [fileName, template] of this.swiftUITemplates) {
      try {
        const adaptedContent = await this.adaptSwiftUIFile(fileName, template, uiAdaptations);
        adaptations.adaptations.push({
          file: fileName,
          changes: adaptedContent.changes,
          success: true
        });
      } catch (error) {
        console.error(`Error adapting ${fileName}:`, error);
        adaptations.adaptations.push({
          file: fileName,
          error: error.message,
          success: false
        });
      }
    }

    this.adaptationHistory.set(userId, adaptations);
    return adaptations;
  }

  determineUIAdaptations(userProfile, healthInsights) {
    const adaptations = {
      colorScheme: 'default',
      layoutDensity: 'normal',
      focusAreas: [],
      accessibility: 'standard',
      urgencyLevel: 'normal',
      personalizationLevel: 'moderate'
    };

    // Determine color scheme based on conditions and mood
    if (userProfile.conditions.pcos || userProfile.conditions.endometriosis) {
      adaptations.colorScheme = 'calming'; // Softer, more soothing colors
    }
    
    if (userProfile.healthMetrics.symptoms.mood.average < 3) {
      adaptations.colorScheme = 'uplifting'; // Brighter, more energizing colors
    }

    // Determine layout density based on stress level and busy score
    if (userProfile.lifestyleFactors.stress.stressLevel === 'high') {
      adaptations.layoutDensity = 'minimal'; // Less cluttered, more focused
    }

    // Determine focus areas based on health insights
    if (healthInsights.cycleInsights.some(insight => insight.priority === 'high')) {
      adaptations.focusAreas.push('cycle_tracking');
      adaptations.urgencyLevel = 'high';
    }

    if (healthInsights.healthInsights.some(rec => rec.category === 'sleep')) {
      adaptations.focusAreas.push('sleep_tracking');
    }

    if (healthInsights.healthInsights.some(rec => rec.category === 'activity')) {
      adaptations.focusAreas.push('activity_tracking');
    }

    // Determine accessibility needs
    if (userProfile.age > 40) {
      adaptations.accessibility = 'enhanced'; // Larger text, more contrast
    }

    // Determine personalization level
    if (userProfile.preferences.coachingStyle === 'motivational') {
      adaptations.personalizationLevel = 'high';
    }

    return adaptations;
  }

  async adaptSwiftUIFile(fileName, template, adaptations) {
    const changes = [];
    let adaptedContent = template;

    // Apply color scheme adaptations
    if (adaptations.colorScheme !== 'default') {
      const colorChanges = this.generateColorSchemeChanges(adaptations.colorScheme);
      for (const change of colorChanges) {
        try {
          const result = await morphApply(adaptedContent, change.snippet, change.instruction);
          adaptedContent = result.file;
          changes.push({
            type: 'color_scheme',
            description: change.description,
            success: true
          });
        } catch (error) {
          changes.push({
            type: 'color_scheme',
            description: change.description,
            error: error.message,
            success: false
          });
        }
      }
    }

    // Apply layout density adaptations
    if (adaptations.layoutDensity !== 'normal') {
      const layoutChanges = this.generateLayoutDensityChanges(adaptations.layoutDensity);
      for (const change of layoutChanges) {
        try {
          const result = await morphApply(adaptedContent, change.snippet, change.instruction);
          adaptedContent = result.file;
          changes.push({
            type: 'layout_density',
            description: change.description,
            success: true
          });
        } catch (error) {
          changes.push({
            type: 'layout_density',
            description: change.description,
            error: error.message,
            success: false
          });
        }
      }
    }

    // Apply focus area adaptations
    if (adaptations.focusAreas.length > 0) {
      const focusChanges = this.generateFocusAreaChanges(adaptations.focusAreas);
      for (const change of focusChanges) {
        try {
          const result = await morphApply(adaptedContent, change.snippet, change.instruction);
          adaptedContent = result.file;
          changes.push({
            type: 'focus_area',
            description: change.description,
            success: true
          });
        } catch (error) {
          changes.push({
            type: 'focus_area',
            description: change.description,
            error: error.message,
            success: false
          });
        }
      }
    }

    // Apply accessibility adaptations
    if (adaptations.accessibility !== 'standard') {
      const accessibilityChanges = this.generateAccessibilityChanges(adaptations.accessibility);
      for (const change of accessibilityChanges) {
        try {
          const result = await morphApply(adaptedContent, change.snippet, change.instruction);
          adaptedContent = result.file;
          changes.push({
            type: 'accessibility',
            description: change.description,
            success: true
          });
        } catch (error) {
          changes.push({
            type: 'accessibility',
            description: change.description,
            error: error.message,
            success: false
          });
        }
      }
    }

    return { content: adaptedContent, changes };
  }

  generateColorSchemeChanges(colorScheme) {
    const changes = [];

    switch (colorScheme) {
      case 'calming':
        changes.push({
          snippet: `
// MARK: - Calming Color Palette
fileprivate extension Color {
    static let calm1 = Color(red: 0.85, green: 0.92, blue: 0.95)
    static let calm2 = Color(red: 0.78, green: 0.88, blue: 0.92)
    static let calm3 = Color(red: 0.70, green: 0.84, blue: 0.88)
    static let calm4 = Color(red: 0.62, green: 0.80, blue: 0.84)
}`,
          instruction: 'Replace the existing color palette with a calming, soothing color scheme using soft blues and teals',
          description: 'Applied calming color palette'
        });
        break;

      case 'uplifting':
        changes.push({
          snippet: `
// MARK: - Uplifting Color Palette
fileprivate extension Color {
    static let uplift1 = Color(red: 0.98, green: 0.95, blue: 0.75)
    static let uplift2 = Color(red: 0.95, green: 0.88, blue: 0.65)
    static let uplift3 = Color(red: 0.92, green: 0.82, blue: 0.55)
    static let uplift4 = Color(red: 0.88, green: 0.75, blue: 0.45)
}`,
          instruction: 'Replace the existing color palette with an uplifting, energizing color scheme using warm yellows and oranges',
          description: 'Applied uplifting color palette'
        });
        break;
    }

    return changes;
  }

  generateLayoutDensityChanges(density) {
    const changes = [];

    switch (density) {
      case 'minimal':
        changes.push({
          snippet: `
                    VStack(spacing: 20) {
                        // Essential content only
                        Text("Nereid")
                            .font(.system(size: min(48, width*0.16), weight: .heavy, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(colors: [.white, .pearl2],
                                               startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            .shadow(color: .black.opacity(0.45), radius: 0, x: 1, y: 0)
                            .shadow(color: .black.opacity(0.45), radius: 0, x: -1, y: 0)
                            .shadow(color: .black.opacity(0.45), radius: 0, x: 0, y: 1)
                            .shadow(color: .black.opacity(0.45), radius: 0, x: 0, y: -1)
                            .shadow(color: .white.opacity(0.35), radius: 10, y: 2)
                            .padding(.top, 8)

                        Spacer(minLength: 0)

                        // Simplified pearl control
                        PearlDial(selected: $target, valueString: currentValueString, progress: currentProgress, onDrag: handleDrag)
                            .frame(height: min(240, geo.size.height*0.28))
                            .padding(.horizontal, 24)

                        Spacer(minLength: 0)

                        // Single essential readout
                        ReadoutPill(title: "Cycle", value: "\\(cycleLength) d")
                            .padding(.horizontal, 24)

                        Spacer(minLength: 0)

                        // Simplified CTA
                        Button {
                            withAnimation(.easeInOut) {
                                appState.hasCompletedOnboarding = true
                            }
                        } label: {
                            Text("Begin")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                        }
                        .background(
                            LinearGradient(colors: [.pearl2, .pearl4], startPoint: .leading, endPoint: .trailing)
                                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                        )
                        .foregroundColor(.white)
                        .shadow(radius: 8, y: 2)
                        .padding(.horizontal, 24)
                        .padding(.bottom, 22)
                    }`,
          instruction: 'Simplify the layout to be more minimal and focused, reducing visual clutter and spacing',
          description: 'Applied minimal layout density'
        });
        break;
    }

    return changes;
  }

  generateFocusAreaChanges(focusAreas) {
    const changes = [];

    if (focusAreas.includes('cycle_tracking')) {
      changes.push({
        snippet: `
                    // Enhanced cycle tracking section
                    VStack(spacing: 16) {
                        Text("Cycle Tracking")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        
                        HStack(spacing: 20) {
                            VStack {
                                Text("Current Phase")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("Follicular")
                                    .font(.headline)
                                    .foregroundColor(.blue)
                            }
                            
                            VStack {
                                Text("Day of Cycle")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("12")
                                    .font(.headline)
                                    .foregroundColor(.primary)
                            }
                            
                            VStack {
                                Text("Next Period")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("16 days")
                                    .font(.headline)
                                    .foregroundColor(.red)
                            }
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                    }`,
        instruction: 'Add a prominent cycle tracking section to the main view to emphasize cycle awareness',
        description: 'Added cycle tracking focus area'
      });
    }

    if (focusAreas.includes('sleep_tracking')) {
      changes.push({
        snippet: `
                    // Sleep tracking section
                    VStack(spacing: 16) {
                        Text("Sleep Quality")
                            .font(.title2)
                            .fontWeight(.semibold)
                            .foregroundColor(.primary)
                        
                        HStack(spacing: 20) {
                            VStack {
                                Text("Hours")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("7.5")
                                    .font(.headline)
                                    .foregroundColor(.green)
                            }
                            
                            VStack {
                                Text("Deep Sleep")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("32%")
                                    .font(.headline)
                                    .foregroundColor(.blue)
                            }
                            
                            VStack {
                                Text("Quality")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text("Good")
                                    .font(.headline)
                                    .foregroundColor(.orange)
                            }
                        }
                        .padding()
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                    }`,
        instruction: 'Add a sleep tracking section to highlight sleep quality and its impact on health',
        description: 'Added sleep tracking focus area'
      });
    }

    return changes;
  }

  generateAccessibilityChanges(accessibility) {
    const changes = [];

    if (accessibility === 'enhanced') {
      changes.push({
        snippet: `
                    Text("Nereid")
                        .font(.system(size: min(64, width*0.20), weight: .heavy, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(colors: [.white, .pearl2],
                                           startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                        .shadow(color: .black.opacity(0.6), radius: 0, x: 2, y: 0)
                        .shadow(color: .black.opacity(0.6), radius: 0, x: -2, y: 0)
                        .shadow(color: .black.opacity(0.6), radius: 0, x: 0, y: 2)
                        .shadow(color: .black.opacity(0.6), radius: 0, x: 0, y: -2)
                        .shadow(color: .white.opacity(0.4), radius: 12, y: 3)
                        .padding(.top, 8)`,
        instruction: 'Increase font size and shadow contrast for better accessibility and readability',
        description: 'Enhanced accessibility with larger text and better contrast'
      });
    }

    return changes;
  }

  async saveAdaptedFiles(userId, adaptations) {
    const outputDir = path.join(__dirname, `../data/adapted_ui/${userId}`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save adapted files
    for (const adaptation of adaptations.adaptations) {
      if (adaptation.success && adaptation.content) {
        const filePath = path.join(outputDir, adaptation.file);
        fs.writeFileSync(filePath, adaptation.content);
      }
    }

    // Save adaptation metadata
    const metadataPath = path.join(outputDir, 'adaptation_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(adaptations, null, 2));

    console.log(`Adapted UI files saved for user ${userId} in ${outputDir}`);
  }

  async generatePersonalizedNotifications(userId, healthInsights) {
    const notifications = [];

    // Generate cycle-related notifications
    if (healthInsights.cycleInsights.some(insight => insight.priority === 'high')) {
      notifications.push({
        id: `cycle_${Date.now()}`,
        title: "Cycle Tracking Reminder",
        body: "Your cycle pattern shows some irregularities. Regular tracking can help identify patterns.",
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        repeat: 'daily',
        category: 'cycle_tracking'
      });
    }

    // Generate health-related notifications
    const sleepInsights = healthInsights.healthInsights.filter(rec => rec.category === 'sleep');
    if (sleepInsights.length > 0) {
      notifications.push({
        id: `sleep_${Date.now()}`,
        title: "Sleep Optimization",
        body: sleepInsights[0].description,
        scheduledTime: new Date(Date.now() + 20 * 60 * 60 * 1000), // 8 PM
        repeat: 'daily',
        category: 'sleep'
      });
    }

    // Generate lifestyle notifications
    const stressInsights = healthInsights.lifestyleInsights.filter(rec => rec.category === 'stress');
    if (stressInsights.length > 0) {
      notifications.push({
        id: `stress_${Date.now()}`,
        title: "Stress Management",
        body: stressInsights[0].description,
        scheduledTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 PM
        repeat: 'daily',
        category: 'stress'
      });
    }

    return notifications;
  }

  async createWeeklyDemo(userId, weekNumber, userProfile, healthInsights) {
    console.log(`Creating week ${weekNumber} demo for user ${userId}`);
    
    const demoData = {
      userId,
      week: weekNumber,
      timestamp: new Date().toISOString(),
      profile: userProfile,
      insights: healthInsights,
      uiAdaptations: await this.adaptUIForUser(userId, userProfile, healthInsights),
      notifications: await this.generatePersonalizedNotifications(userId, healthInsights),
      progress: this.generateWeeklyProgress(weekNumber, userProfile)
    };

    // Save demo data
    const demoPath = path.join(__dirname, `../data/demos/week_${weekNumber}_${userId}.json`);
    fs.writeFileSync(demoPath, JSON.stringify(demoData, null, 2));

    return demoData;
  }

  generateWeeklyProgress(weekNumber, userProfile) {
    const progress = {
      goals: [],
      metrics: {},
      improvements: [],
      challenges: []
    };

    // Simulate progress based on week number
    switch (weekNumber) {
      case 1:
        progress.goals = [
          { title: "Track cycle daily", completed: 7, total: 7, status: "completed" },
          { title: "Improve sleep", completed: 5, total: 7, status: "in_progress" },
          { title: "Reduce stress", completed: 3, total: 7, status: "in_progress" }
        ];
        progress.improvements = ["Consistent cycle tracking", "Better sleep awareness"];
        progress.challenges = ["Stress management", "Finding time for self-care"];
        break;

      case 2:
        progress.goals = [
          { title: "Track cycle daily", completed: 14, total: 14, status: "completed" },
          { title: "Improve sleep", completed: 10, total: 14, status: "in_progress" },
          { title: "Reduce stress", completed: 8, total: 14, status: "in_progress" }
        ];
        progress.improvements = ["Pattern recognition", "Sleep quality improvement", "Stress reduction techniques"];
        progress.challenges = ["Maintaining consistency", "Work-life balance"];
        break;

      case 3:
        progress.goals = [
          { title: "Track cycle daily", completed: 21, total: 21, status: "completed" },
          { title: "Improve sleep", completed: 18, total: 21, status: "completed" },
          { title: "Reduce stress", completed: 15, total: 21, status: "in_progress" }
        ];
        progress.improvements = ["Predictable cycle patterns", "Consistent sleep schedule", "Effective stress management"];
        progress.challenges = ["Long-term habit formation"];
        break;

      case 4:
        progress.goals = [
          { title: "Track cycle daily", completed: 28, total: 28, status: "completed" },
          { title: "Improve sleep", completed: 25, total: 28, status: "completed" },
          { title: "Reduce stress", completed: 22, total: 28, status: "completed" }
        ];
        progress.improvements = ["Mastery of cycle tracking", "Optimal sleep patterns", "Effective stress management", "Overall health improvement"];
        progress.challenges = ["Maintaining progress long-term"];
        break;
    }

    return progress;
  }
}

module.exports = { UIMorphAgent };
