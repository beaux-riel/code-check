#!/bin/bash

# Code Check Dashboard Startup Script

echo "🚀 Starting Code Check Dashboard..."
echo "=================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the web-app directory."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Start the development server
echo "🌐 Starting development server..."
echo "Dashboard will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

pnpm dev --host
