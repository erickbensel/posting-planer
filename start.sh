#!/bin/bash

echo "🚀 Bensel Media – Posting Planer wird gestartet..."

# Start Next.js dev server in background
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Warte auf Server..."
until curl -s http://localhost:3000 > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Server läuft!"

# Open app in browser
open http://localhost:3000

# Open Claude
open -a "Claude" 2>/dev/null || open "https://claude.ai" 2>/dev/null

echo "🎉 Alles gestartet! App: http://localhost:3000"

# Keep script running (so npm run dev stays alive)
wait $DEV_PID
