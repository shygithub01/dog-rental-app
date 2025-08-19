#!/bin/bash

# Start the puzzle game development server
echo "🧩 Starting Puzzle Master development server..."
echo "📍 Server will be available at: http://localhost:5173"
echo "🔄 Press Ctrl+C to stop the server"
echo ""

# Use the local vite binary to avoid path issues
./node_modules/.bin/vite

