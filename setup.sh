#!/bin/bash

echo "🌊 Setting up Nereid AI Agent System..."
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Navigate to backend directory
cd backend

echo "📦 Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp env.example .env
    echo "✅ Environment file created"
fi

# Run database setup
echo "🔧 Setting up database..."
npm run setup-db

echo ""
echo "🎉 Backend setup completed!"
echo ""
echo "Next steps:"
echo "1. Start the backend server: cd backend && npm start"
echo "2. Test the system: cd backend && npm test"
echo "3. Open Nerea/Nerea.xcodeproj in Xcode"
echo "4. Build and run the iOS app"
echo ""
echo "🌊 Welcome to Nereid!"
