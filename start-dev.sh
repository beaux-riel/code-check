#!/bin/bash

# CodeCheck Development Startup Script
# This script starts both the API backend and web frontend

set -e

echo "🚀 Starting CodeCheck Development Environment..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build packages first
echo "🔨 Building packages..."
npm run build

# Initialize database
echo "🗄️  Initializing database..."
cd packages/api-backend
npx prisma generate
npx prisma db push
cd ../..

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

# Set up trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Start API backend in background
echo "🖥️  Starting API backend on port 3001..."
cd packages/api-backend
npm start &
BACKEND_PID=$!
cd ../..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Backend started successfully"

# Start frontend in background
echo "🌐 Starting web frontend on port 3000..."
cd packages/web-app
npm start &
FRONTEND_PID=$!
cd ../..

echo "✅ Development environment started!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🖥️  Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
