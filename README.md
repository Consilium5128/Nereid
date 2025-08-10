# Nereid - AI-Powered Health Tracking App

Nereid is a sophisticated health tracking application that combines SwiftUI frontend with an AI agent backend to provide personalized health insights, cycle predictions, and adaptive recommendations.

## Features

### 🤖 AI Agent System
- **Signal Analysis Agent (SAA)**: Analyzes sensor data and user inputs to detect patterns and abnormalities
- **Dynamic Prompt Generator Agent (DPGA)**: Generates personalized health plans and recommendations
- **Morph Integration**: Dynamically adapts UI components based on user health patterns
- **Real-time Analysis**: Continuous monitoring and analysis of health data

### 📱 SwiftUI Frontend
- **Beautiful, Minimalist Design**: Clean, water-themed interface
- **Real-time Data Sync**: Seamless integration with AI backend
- **Adaptive UI**: Components that change based on AI recommendations
- **Health Tracking**: Comprehensive cycle and symptom tracking
- **Predictions**: AI-powered cycle and health predictions

### 🔬 Health Monitoring
- **Cycle Prediction**: Advanced period and fertility tracking
- **Abnormality Detection**: Identifies potential health issues
- **Risk Assessment**: Personalized risk scoring
- **Goal Tracking**: Adaptive health goals based on AI analysis

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   SwiftUI App   │    │   AI Backend    │    │   Database      │
│                 │    │                 │    │                 │
│ • Home Dashboard│◄──►│ • SAA Agent     │◄──►│ • PostgreSQL    │
│ • AI Insights   │    │ • DPGA Agent    │    │ • Redis Cache   │
│ • Predictions   │    │ • Morph Agent   │    │                 │
│ • Goals         │    │ • REST API      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **Redis** (v6 or higher)
- **Xcode** (v15 or higher)
- **macOS** (for iOS development)

### Backend Setup

1. **Clone and navigate to the backend directory:**
   ```bash
   cd mh-agent-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=nereid
   DB_USER=postgres
   DB_PASSWORD=your_password
   REDIS_URL=redis://localhost:6379
   MOCK=true
   ```

4. **Set up the database:**
   ```bash
   # Create PostgreSQL database
   createdb nereid
   
   # Run database setup script
   npm run setup-db
   ```

5. **Start the backend server:**
   ```bash
   npm start
   ```

   The server will be available at `http://localhost:3000`

### Frontend Setup

1. **Open the iOS project in Xcode:**
   ```bash
   open Nerea/Nerea.xcodeproj
   ```

2. **Build and run the app:**
   - Select your target device or simulator
   - Press `Cmd+R` to build and run

3. **Configure network settings:**
   - The app is configured to connect to `localhost:3000`
   - For physical devices, update the base URL in `NetworkService.swift`

## API Endpoints

### Health Check
- `GET /health` - Server status

### User Management
- `POST /api/users` - Create/update user
- `GET /api/users/:userId` - Get user profile

### Sensor Data
- `POST /api/sensors/:userId` - Send sensor data
- `GET /api/sensors/:userId` - Get sensor data

### User Logs
- `POST /api/logs/:userId` - Send user log
- `GET /api/logs/:userId` - Get user logs

### Cycle Events
- `POST /api/cycles/:userId` - Send cycle event
- `GET /api/cycles/:userId` - Get cycle events

### AI Analysis
- `POST /api/analyze/:userId` - Trigger AI analysis
- `GET /api/analysis/:userId` - Get AI analysis history

### Predictions
- `GET /api/predictions/:userId` - Get cycle predictions

### UI Adaptations
- `GET /api/ui-adaptations/:userId` - Get UI adaptations

## AI Agent System

### Signal Analysis Agent (SAA)
- Analyzes sensor data (temperature, sleep, heart rate, etc.)
- Calculates risk scores and uncertainty levels
- Detects health abnormalities
- Predicts cycle phases and next period

### Dynamic Prompt Generator Agent (DPGA)
- Generates personalized health plans
- Creates adaptive recommendations
- Determines UI adaptations
- Coordinates with Morph for code changes

### Morph Integration
- Dynamically modifies SwiftUI components
- Adapts UI based on user health patterns
- Implements personalized interfaces

## Data Flow

1. **Data Collection**: SwiftUI app collects sensor data and user inputs
2. **Data Transmission**: Data sent to AI backend via REST API
3. **AI Analysis**: SAA processes data and detects patterns
4. **Plan Generation**: DPGA creates personalized recommendations
5. **UI Adaptation**: Morph applies UI changes if needed
6. **Real-time Updates**: Results sent back to SwiftUI app

## Testing

### Backend Testing
```bash
# Test the demo endpoint
curl http://localhost:3000/demo

# Test health check
curl http://localhost:3000/health
```

### Frontend Testing
- Use the iOS Simulator or physical device
- Navigate through different tabs to test functionality
- Check AI Insights tab for real-time analysis

## Development

### Backend Development
```bash
# Development mode with auto-reload
npm run dev

# Run database setup
npm run setup-db
```

### Frontend Development
- Open `Nerea.xcodeproj` in Xcode
- Make changes to SwiftUI views
- Use Xcode's preview feature for rapid iteration

## Configuration

### Environment Variables
- `PORT`: Backend server port (default: 3000)
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_NAME`: Database name (default: nereid)
- `REDIS_URL`: Redis connection URL
- `MOCK`: Use mock AI responses (default: true)
- `MORPH_ENABLED`: Enable Morph integration (default: false)

### AI Configuration
- Set `MOCK=false` to use real Claude API
- Add `CLAUDE_API_KEY` for real AI responses
- Configure `MORPH_API_KEY` for UI adaptations

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Verify database exists: `createdb nereid`

2. **Redis Connection Error**
   - Ensure Redis is running: `redis-server`
   - Check Redis URL in `.env`

3. **iOS App Can't Connect**
   - Verify backend is running on port 3000
   - Check network permissions in iOS
   - Update base URL for physical devices

4. **AI Analysis Not Working**
   - Check if `MOCK=true` in `.env`
   - Verify API endpoints are accessible
   - Check server logs for errors

### Logs
- Backend logs are displayed in the terminal
- iOS logs are available in Xcode console
- Database logs: `tail -f /var/log/postgresql/postgresql-*.log`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Nereid** - Empowering health through intelligent AI insights 🌊