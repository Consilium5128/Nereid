const fs = require('fs');
const path = require('path');

// Create plans directory if it doesn't exist
const plansDir = path.join(__dirname, '..', 'plans');
if (!fs.existsSync(plansDir)) {
    fs.mkdirSync(plansDir, { recursive: true });
}

// Dummy user profiles for different scenarios
const dummyUsers = [
    {
        id: "P900",
        age: 28,
        job: "software_engineer",
        timezone: "America/Los_Angeles",
        onboarding: {
            last_period_start: "2025-07-01",
            typical_cycle_length: 28,
            typical_period_length: 5
        },
        notification_pref: "detailed",
        conditions: {
            pcos: false,
            endometriosis: false,
            irregularPeriods: false
        },
        preferences: {
            journalingMode: "text",
            goalFocus: "performance",
            coachingStyle: "motivational"
        }
    },
    {
        id: "P901",
        age: 32,
        job: "designer",
        timezone: "America/New_York",
        onboarding: {
            last_period_start: "2025-07-15",
            typical_cycle_length: 32,
            typical_period_length: 6
        },
        notification_pref: "minimal",
        conditions: {
            pcos: true,
            endometriosis: false,
            irregularPeriods: true
        },
        preferences: {
            journalingMode: "audio",
            goalFocus: "symptom_management",
            coachingStyle: "supportive"
        }
    },
    {
        id: "P902",
        age: 25,
        job: "student",
        timezone: "America/Chicago",
        onboarding: {
            last_period_start: "2025-07-10",
            typical_cycle_length: 26,
            typical_period_length: 4
        },
        notification_pref: "moderate",
        conditions: {
            pcos: false,
            endometriosis: false,
            irregularPeriods: false
        },
        preferences: {
            journalingMode: "text",
            goalFocus: "education",
            coachingStyle: "educational"
        }
    }
];

// Generate different types of plans based on cycle phases and health states
function generatePlan(userId, dayOfCycle, cyclePhase, healthState, abnormalities = []) {
    const timestamp = Date.now();
    const planId = `plan_${timestamp}`;
    
    let plan = {
        message: "",
        plan: {
            track: [],
            maintain: [],
            treat: [],
            escalate: false
        },
        plan_version: "2.0",
        next_questions: [],
        rationale: "",
        ui_adaptation: {
            theme: "default",
            layout: "standard",
            notifications: "normal"
        },
        cycle_context: {
            phase: cyclePhase,
            day: dayOfCycle,
            next_period_prediction: null,
            fertility_window: null,
            optimal_activity_level: "moderate"
        },
        health_insights: [],
        timestamp: new Date().toISOString(),
        user_id: userId
    };

    // Generate cycle-specific plans
    switch (cyclePhase) {
        case 'menstrual':
            plan.message = `You're in your menstrual phase (day ${dayOfCycle}). Your body needs extra care and rest during this time.`;
            plan.plan.track = [
                "Monitor flow intensity and color",
                "Track pain levels and location",
                "Record sleep quality and duration",
                "Note mood changes and energy levels"
            ];
            plan.plan.maintain = [
                "Stay hydrated (2.5L water daily)",
                "Consider iron-rich foods",
                "Take regular screen breaks (20-20-20 rule)",
                "Practice gentle stretching or yoga"
            ];
            plan.plan.treat = [
                "Use heating pad for cramps",
                "Consider magnesium supplements",
                "Take warm baths for relaxation"
            ];
            plan.cycle_context.optimal_activity_level = "low";
            break;

        case 'follicular':
            plan.message = `You're in your follicular phase (day ${dayOfCycle}). This is a great time for building strength and energy.`;
            plan.plan.track = [
                "Monitor energy levels throughout the day",
                "Track workout performance",
                "Record mood and motivation",
                "Note appetite changes"
            ];
            plan.plan.maintain = [
                "Maintain regular exercise routine",
                "Focus on protein-rich nutrition",
                "Stay consistent with sleep schedule",
                "Engage in creative activities"
            ];
            plan.plan.treat = [];
            plan.cycle_context.optimal_activity_level = "high";
            break;

        case 'ovulatory':
            plan.message = `You're in your ovulatory phase (day ${dayOfCycle}). Peak energy and fertility window.`;
            plan.plan.track = [
                "Monitor cervical mucus changes",
                "Track libido and energy levels",
                "Record social interactions",
                "Note any ovulation pain"
            ];
            plan.plan.maintain = [
                "Engage in high-intensity workouts",
                "Focus on social activities",
                "Maintain balanced nutrition",
                "Practice stress management"
            ];
            plan.plan.treat = [];
            plan.cycle_context.fertility_window = true;
            plan.cycle_context.optimal_activity_level = "very_high";
            break;

        case 'luteal':
            plan.message = `You're in your luteal phase (day ${dayOfCycle}). Focus on self-care and preparation.`;
            plan.plan.track = [
                "Monitor mood changes",
                "Track food cravings",
                "Record sleep patterns",
                "Note any premenstrual symptoms"
            ];
            plan.plan.maintain = [
                "Practice stress-reduction techniques",
                "Maintain regular sleep schedule",
                "Focus on complex carbohydrates",
                "Engage in moderate exercise"
            ];
            plan.plan.treat = [
                "Consider B6 supplements",
                "Practice mindfulness or meditation",
                "Use calming essential oils"
            ];
            plan.cycle_context.optimal_activity_level = "moderate";
            break;
    }

    // Add health state specific modifications
    if (healthState === 'stressed') {
        plan.message += " Your stress levels are elevated. Consider additional self-care measures.";
        plan.plan.maintain.push("Practice deep breathing exercises");
        plan.plan.maintain.push("Limit caffeine intake");
        plan.ui_adaptation.theme = "calm";
        plan.ui_adaptation.notifications = "reduced";
    } else if (healthState === 'fatigued') {
        plan.message += " You're experiencing fatigue. Prioritize rest and recovery.";
        plan.plan.maintain.push("Take short naps if needed");
        plan.plan.maintain.push("Reduce screen time before bed");
        plan.plan.treat.push("Consider vitamin D supplements");
        plan.ui_adaptation.theme = "gentle";
    } else if (healthState === 'energetic') {
        plan.message += " You have high energy levels. Great time to tackle challenging tasks.";
        plan.plan.maintain.push("Channel energy into productive activities");
        plan.plan.maintain.push("Engage in social activities");
        plan.ui_adaptation.theme = "vibrant";
    }

    // Add abnormality-specific recommendations
    if (abnormalities.length > 0) {
        plan.message += " We've detected some unusual patterns that need attention.";
        plan.plan.escalate = true;
        plan.plan.treat.push("Schedule a check-in with your healthcare provider");
        
        abnormalities.forEach(abnormality => {
            if (abnormality.type === 'temperature') {
                plan.plan.track.push("Monitor temperature more frequently");
                plan.plan.treat.push("Consider fever-reducing measures if needed");
            } else if (abnormality.type === 'sleep') {
                plan.plan.track.push("Track sleep quality more closely");
                plan.plan.treat.push("Practice sleep hygiene techniques");
            } else if (abnormality.type === 'mood') {
                plan.plan.track.push("Monitor mood changes throughout the day");
                plan.plan.treat.push("Consider talking to a mental health professional");
            }
        });
    }

    // Generate health insights
    plan.health_insights = generateHealthInsights(cyclePhase, healthState, abnormalities);

    // Generate next questions based on context
    plan.next_questions = generateNextQuestions(cyclePhase, dayOfCycle, healthState);

    // Generate rationale
    plan.rationale = generateRationale(cyclePhase, healthState, abnormalities);

    return plan;
}

function generateHealthInsights(cyclePhase, healthState, abnormalities) {
    const insights = [];
    
    if (cyclePhase === 'menstrual') {
        insights.push({
            type: "cycle_health",
            title: "Menstrual Phase Support",
            description: "Your body needs extra nutrients and rest during menstruation",
            actionable: true,
            priority: "high"
        });
    }
    
    if (healthState === 'stressed') {
        insights.push({
            type: "lifestyle",
            title: "Stress Management",
            description: "Elevated stress can impact cycle regularity and symptoms",
            actionable: true,
            priority: "medium"
        });
    }
    
    if (abnormalities.length > 0) {
        insights.push({
            type: "health_monitoring",
            title: "Pattern Detection",
            description: "Unusual patterns detected - continue monitoring closely",
            actionable: true,
            priority: "high"
        });
    }
    
    return insights;
}

function generateNextQuestions(cyclePhase, dayOfCycle, healthState) {
    const questions = [];
    
    if (cyclePhase === 'menstrual') {
        questions.push("How heavy is your flow today?");
        questions.push("Are you experiencing any unusual pain?");
        questions.push("How is your energy level compared to usual?");
    } else if (cyclePhase === 'ovulatory') {
        questions.push("Have you noticed any changes in cervical mucus?");
        questions.push("How is your energy level today?");
        questions.push("Are you experiencing any ovulation pain?");
    }
    
    if (healthState === 'stressed') {
        questions.push("What's causing your stress today?");
        questions.push("Have you tried any relaxation techniques?");
    }
    
    return questions;
}

function generateRationale(cyclePhase, healthState, abnormalities) {
    let rationale = `Based on your current cycle phase (${cyclePhase}) and health state (${healthState}), `;
    
    if (cyclePhase === 'menstrual') {
        rationale += "your body is shedding the uterine lining and needs extra care. ";
    } else if (cyclePhase === 'follicular') {
        rationale += "your body is preparing for ovulation and building energy. ";
    } else if (cyclePhase === 'ovulatory') {
        rationale += "you're at peak fertility and energy levels. ";
    } else if (cyclePhase === 'luteal') {
        rationale += "your body is preparing for potential pregnancy or menstruation. ";
    }
    
    if (healthState === 'stressed') {
        rationale += "Stress can impact hormone balance and cycle regularity. ";
    } else if (healthState === 'fatigued') {
        rationale += "Fatigue may indicate need for additional rest and nutrition. ";
    }
    
    if (abnormalities.length > 0) {
        rationale += "Unusual patterns detected require closer monitoring. ";
    }
    
    rationale += "These recommendations are tailored to support your current phase and health state.";
    
    return rationale;
}

// Generate plans for different scenarios
function generateAllPlans() {
    const plans = [];
    
    // Generate plans for each user across different cycle phases
    dummyUsers.forEach(user => {
        // Menstrual phase plans (days 1-5)
        for (let day = 1; day <= 5; day++) {
            plans.push(generatePlan(user.id, day, 'menstrual', 'normal', []));
            plans.push(generatePlan(user.id, day, 'menstrual', 'stressed', [
                { type: 'mood', severity: 'moderate', description: 'Elevated stress levels detected' }
            ]));
        }
        
        // Follicular phase plans (days 6-13)
        for (let day = 6; day <= 13; day++) {
            plans.push(generatePlan(user.id, day, 'follicular', 'energetic', []));
            plans.push(generatePlan(user.id, day, 'follicular', 'normal', []));
        }
        
        // Ovulatory phase plans (days 14-16)
        for (let day = 14; day <= 16; day++) {
            plans.push(generatePlan(user.id, day, 'ovulatory', 'energetic', []));
            plans.push(generatePlan(user.id, day, 'ovulatory', 'normal', []));
        }
        
        // Luteal phase plans (days 17-28)
        for (let day = 17; day <= 28; day++) {
            plans.push(generatePlan(user.id, day, 'luteal', 'normal', []));
            plans.push(generatePlan(user.id, day, 'luteal', 'fatigued', [
                { type: 'sleep', severity: 'moderate', description: 'Reduced sleep quality detected' }
            ]));
        }
    });
    
    return plans;
}

// Generate and save plans
function savePlans() {
    const plans = generateAllPlans();
    
    plans.forEach((plan, index) => {
        const timestamp = Date.now() + index; // Ensure unique timestamps
        const filename = `plan_${timestamp}.json`;
        const filepath = path.join(plansDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(plan, null, 2));
        console.log(`Generated plan: ${filename}`);
    });
    
    console.log(`\nGenerated ${plans.length} agentic AI plans in ${plansDir}`);
    
    // Create a summary file
    const summary = {
        total_plans: plans.length,
        users: dummyUsers.map(u => u.id),
        phases: ['menstrual', 'follicular', 'ovulatory', 'luteal'],
        health_states: ['normal', 'stressed', 'fatigued', 'energetic'],
        generated_at: new Date().toISOString(),
        plan_files: plans.map((plan, index) => `plan_${Date.now() + index}.json`)
    };
    
    const summaryPath = path.join(plansDir, 'plans_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Created summary: plans_summary.json`);
}

// Run the script
if (require.main === module) {
    savePlans();
}

module.exports = { generatePlan, generateAllPlans, savePlans };
