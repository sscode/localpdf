#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting PDF Extractor..."

# Kill anything already on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Start backend
cd "$ROOT/backend"
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend running at http://localhost:8000 (PID $BACKEND_PID)"

# Start frontend
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend running at http://localhost:5173 (PID $FRONTEND_PID)"

echo ""
echo "Open http://localhost:5173"
echo "Press Ctrl+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
