#!/bin/bash

# (The rest of the script remains exactly the same)
echo "🚀 Starting Flux Platform Monolith..."

# 1. Start the API Server & Cron Scheduler (Background)
node dist/server/server.js &
SERVER_PID=$!
echo "✅ Server started with PID $SERVER_PID"

# 2. Start the Job Worker (Background)
node dist/worker/worker.js &
WORKER_PID=$!
echo "✅ Worker started with PID $WORKER_PID"

# 3. Wait for any process to exit
# If one crashes, the container should exit so Docker can restart it
wait -n
  
# Exit with status of process that exited first
exit $?