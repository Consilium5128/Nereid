const fs = require('fs');
const path = require('path');

class CSVProcessor {
    constructor() {
        this.csvPath = path.join(__dirname, '../data/High-Performer_Athlete___2_Months__v6_schema_.csv');
        this.data = [];
        this.processedData = [];
    }

    async loadCSVData() {
        try {
            const csvContent = fs.readFileSync(this.csvPath, 'utf8');
            const lines = csvContent.split('\n');
            const headers = lines[0].split(',');
            
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header.trim()] = values[index]?.trim() || '';
                    });
                    this.data.push(row);
                }
            }
            
            console.log(`Loaded ${this.data.length} data points from CSV`);
            return this.data;
        } catch (error) {
            console.error('Error loading CSV data:', error);
            throw error;
        }
    }

    maskUserData() {
        // Mask sensitive user data while preserving patterns
        this.processedData = this.data.map((row, index) => ({
            ...row,
            patient_id: `USER_${String(index + 1).padStart(3, '0')}`,
            age: Math.floor(Math.random() * 10) + 25, // Randomize age 25-35
            // Keep health conditions but anonymize
            has_pcos: row.has_pcos,
            has_endometriosis: row.has_endometriosis,
            irregular_periods: row.irregular_periods
        }));
        
        return this.processedData;
    }

    generate30DayJourney(userId = 'USER_001') {
        const baseData = this.processedData[0]; // Use first user as base
        const journey = [];
        const startDate = new Date('2025-01-01');
        
        for (let day = 0; day < 30; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);
            
            // Calculate cycle day based on 28-day cycle
            const cycleDay = (day % 28) + 1;
            const cyclePhase = this.determineCyclePhase(cycleDay);
            
            // Generate realistic variations
            const dayData = {
                patient_id: userId,
                date: currentDate.toISOString().split('T')[0],
                age: baseData.age,
                has_pcos: baseData.has_pcos,
                has_endometriosis: baseData.has_endometriosis,
                irregular_periods: baseData.irregular_periods,
                weight_gain_flag: this.generateFlag(day, 0.1),
                insulin_resistance_flag: this.generateFlag(day, 0.05),
                ovarian_cysts_flag: this.generateFlag(day, 0.03),
                hair_thinning_flag: this.generateFlag(day, 0.08),
                heavy_bleeding_flag: this.generateFlag(day, 0.15),
                infertility_flag: this.generateFlag(day, 0.02),
                gi_issues_flag: this.generateFlag(day, 0.12),
                journaling_mode: this.getJournalingMode(day),
                goal_focus: this.getGoalFocus(day),
                preferred_coaching_style: baseData.preferred_coaching_style,
                cycle_length_days: 28,
                flow_duration_days: 5,
                cycle_phase: cyclePhase,
                day_of_phase: cycleDay,
                hrv_ms: this.generateHRV(day, cyclePhase),
                sleep_hours: this.generateSleep(day, cyclePhase),
                deep_sleep_pct: this.generateDeepSleep(day, cyclePhase),
                bbt_c: this.generateBBT(day, cyclePhase),
                steps: this.generateSteps(day, cyclePhase),
                active_minutes: this.generateActiveMinutes(day, cyclePhase),
                cramps_severity: this.generateCramps(day, cyclePhase),
                body_pain_severity: this.generateBodyPain(day, cyclePhase),
                back_pain_severity: this.generateBackPain(day, cyclePhase),
                mood_rating: this.generateMood(day, cyclePhase),
                sentiment_score: this.generateSentiment(day, cyclePhase),
                ambient_light_minutes: this.generateAmbientLight(day),
                is_sunny: this.generateSunny(day),
                uv_index: this.generateUVIndex(day),
                ambient_temp_c: this.generateTemperature(day),
                weather_condition: this.generateWeather(day),
                caffeine_intake_drinks_per_day: this.generateCaffeine(day, cyclePhase),
                meetings_per_day: this.generateMeetings(day),
                busy_score: this.generateBusyScore(day),
                pollen_count: this.generatePollenCount(day),
                aqi: this.generateAQI(day),
                flight_flag: this.generateFlightFlag(day),
                jet_lag_hours: this.generateJetLag(day),
                low_sleep_high_pain: this.generateLowSleepHighPain(day, cyclePhase)
            };
            
            journey.push(dayData);
        }
        
        return journey;
    }

    determineCyclePhase(cycleDay) {
        if (cycleDay <= 5) return 'menstrual';
        if (cycleDay <= 13) return 'follicular';
        if (cycleDay <= 15) return 'ovulatory';
        return 'luteal';
    }

    generateFlag(day, probability) {
        return Math.random() < probability;
    }

    getJournalingMode(day) {
        const modes = ['audio', 'text', 'visual'];
        return modes[Math.floor(Math.random() * modes.length)];
    }

    getGoalFocus(day) {
        const focuses = ['performance', 'wellness', 'balance', 'recovery'];
        return focuses[Math.floor(Math.random() * focuses.length)];
    }

    generateHRV(day, phase) {
        const baseHRV = 65;
        const phaseModifier = {
            'menstrual': -5,
            'follicular': 5,
            'ovulatory': 10,
            'luteal': 0
        };
        return baseHRV + phaseModifier[phase] + (Math.random() - 0.5) * 20;
    }

    generateSleep(day, phase) {
        const baseSleep = 7.5;
        const phaseModifier = {
            'menstrual': -0.5,
            'follicular': 0.2,
            'ovulatory': 0.1,
            'luteal': -0.3
        };
        return Math.max(5, Math.min(9, baseSleep + phaseModifier[phase] + (Math.random() - 0.5) * 2));
    }

    generateDeepSleep(day, phase) {
        const baseDeepSleep = 35;
        const phaseModifier = {
            'menstrual': -5,
            'follicular': 3,
            'ovulatory': 2,
            'luteal': -2
        };
        return Math.max(20, Math.min(50, baseDeepSleep + phaseModifier[phase] + (Math.random() - 0.5) * 10));
    }

    generateBBT(day, phase) {
        const baseBBT = 36.5;
        const phaseModifier = {
            'menstrual': -0.2,
            'follicular': 0.1,
            'ovulatory': 0.3,
            'luteal': 0.4
        };
        return baseBBT + phaseModifier[phase] + (Math.random() - 0.5) * 0.4;
    }

    generateSteps(day, phase) {
        const baseSteps = 12000;
        const phaseModifier = {
            'menstrual': -2000,
            'follicular': 1000,
            'ovulatory': 1500,
            'luteal': -500
        };
        return Math.max(5000, Math.min(20000, baseSteps + phaseModifier[phase] + (Math.random() - 0.5) * 4000));
    }

    generateActiveMinutes(day, phase) {
        const baseActive = 90;
        const phaseModifier = {
            'menstrual': -20,
            'follicular': 15,
            'ovulatory': 25,
            'luteal': -10
        };
        return Math.max(30, Math.min(180, baseActive + phaseModifier[phase] + (Math.random() - 0.5) * 40));
    }

    generateCramps(day, phase) {
        if (phase === 'menstrual') {
            return Math.floor(Math.random() * 4) + 1; // 1-4 during period
        }
        return Math.floor(Math.random() * 2); // 0-1 other phases
    }

    generateBodyPain(day, phase) {
        if (phase === 'menstrual') {
            return Math.floor(Math.random() * 3) + 1; // 1-3 during period
        }
        return Math.floor(Math.random() * 2); // 0-1 other phases
    }

    generateBackPain(day, phase) {
        if (phase === 'menstrual') {
            return Math.floor(Math.random() * 3) + 1; // 1-3 during period
        }
        return Math.floor(Math.random() * 2); // 0-1 other phases
    }

    generateMood(day, phase) {
        const baseMood = 4;
        const phaseModifier = {
            'menstrual': -1,
            'follicular': 0.5,
            'ovulatory': 0.8,
            'luteal': -0.3
        };
        return Math.max(1, Math.min(5, Math.round(baseMood + phaseModifier[phase] + (Math.random() - 0.5) * 2)));
    }

    generateSentiment(day, phase) {
        const baseSentiment = 0.3;
        const phaseModifier = {
            'menstrual': -0.2,
            'follicular': 0.1,
            'ovulatory': 0.3,
            'luteal': -0.1
        };
        return Math.max(-1, Math.min(1, baseSentiment + phaseModifier[phase] + (Math.random() - 0.5) * 0.6));
    }

    generateAmbientLight(day) {
        return Math.floor(Math.random() * 120) + 30; // 30-150 minutes
    }

    generateSunny(day) {
        return Math.random() > 0.4; // 60% chance of sunny
    }

    generateUVIndex(day) {
        return Math.floor(Math.random() * 10) + 1; // 1-10
    }

    generateTemperature(day) {
        return Math.floor(Math.random() * 20) + 10; // 10-30°C
    }

    generateWeather(day) {
        const weathers = ['Sunny', 'Cloudy', 'Rainy', 'Windy'];
        return weathers[Math.floor(Math.random() * weathers.length)];
    }

    generateCaffeine(day, phase) {
        const baseCaffeine = 2;
        const phaseModifier = {
            'menstrual': 0.5,
            'follicular': 0,
            'ovulatory': -0.5,
            'luteal': 0.3
        };
        return Math.max(0, Math.min(5, Math.round(baseCaffeine + phaseModifier[phase] + (Math.random() - 0.5) * 2)));
    }

    generateMeetings(day) {
        return Math.floor(Math.random() * 6) + 1; // 1-6 meetings
    }

    generateBusyScore(day) {
        return Math.floor(Math.random() * 8) + 1; // 1-8
    }

    generatePollenCount(day) {
        return Math.floor(Math.random() * 100) + 1; // 1-100
    }

    generateAQI(day) {
        return Math.floor(Math.random() * 100) + 20; // 20-120
    }

    generateFlightFlag(day) {
        return Math.random() < 0.05; // 5% chance of flight
    }

    generateJetLag(day) {
        if (this.generateFlightFlag(day)) {
            return Math.floor(Math.random() * 8) + 1; // 1-8 hours
        }
        return 0;
    }

    generateLowSleepHighPain(day, phase) {
        const lowSleep = this.generateSleep(day, phase) < 6;
        const highPain = this.generateCramps(day, phase) > 2 || this.generateBodyPain(day, phase) > 2;
        return lowSleep && highPain;
    }

    async saveJourneyToDatabase(journey, db) {
        console.log(`Saving ${journey.length} days of journey data to database...`);
        
        for (const dayData of journey) {
            // Insert user data
            await db.run(`
                INSERT OR REPLACE INTO users (id, name, age, cycle_length, typical_period_length)
                VALUES (?, ?, ?, ?, ?)
            `, [dayData.patient_id, `User ${dayData.patient_id}`, dayData.age, dayData.cycle_length_days, dayData.flow_duration_days]);

            // Insert sensor readings
            const sensorReadings = [
                {
                    source: 'hrv',
                    payload: { ms: dayData.hrv_ms }
                },
                {
                    source: 'sleep',
                    payload: { hours: dayData.sleep_hours, deep_sleep_pct: dayData.deep_sleep_pct }
                },
                {
                    source: 'bbt',
                    payload: { celsius: dayData.bbt_c }
                },
                {
                    source: 'steps',
                    payload: { count: dayData.steps }
                },
                {
                    source: 'active_minutes',
                    payload: { minutes: dayData.active_minutes }
                }
            ];

            for (const reading of sensorReadings) {
                await db.run(`
                    INSERT INTO sensor_readings (user_id, source, payload, timestamp)
                    VALUES (?, ?, ?, ?)
                `, [dayData.patient_id, reading.source, JSON.stringify(reading.payload), dayData.date]);
            }

            // Insert user logs
            await db.run(`
                INSERT INTO user_logs (user_id, log_date, mood, flow, pain, nutrition)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                dayData.patient_id,
                dayData.date,
                dayData.mood_rating.toString(),
                dayData.cramps_severity > 0 ? 'heavy' : 'light',
                dayData.body_pain_severity > 0 ? 'moderate' : 'none',
                'balanced'
            ]);

            // Insert cycle events
            if (dayData.cycle_phase === 'menstrual' && dayData.day_of_phase === 1) {
                await db.run(`
                    INSERT INTO cycle_events (user_id, event_type, event_date)
                    VALUES (?, ?, ?)
                `, [dayData.patient_id, 'period_start', dayData.date]);
            }
        }
        
        console.log('Journey data saved to database successfully!');
    }
}

module.exports = CSVProcessor;
