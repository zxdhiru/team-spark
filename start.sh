#!/bin/bash

# Hate Speech Detection Plugin Startup Script

echo "🚀 Starting Hate Speech Detection Plugin..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB or use Docker."
    echo "   Docker command: docker run -d -p 27017:27017 --name mongodb mongo:latest"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your configuration before starting the service."
    exit 1
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Start the service
echo "🌟 Starting the service..."
npm start

