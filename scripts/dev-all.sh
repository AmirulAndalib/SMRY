#!/usr/bin/env bash
# Start all SMRY services for local development:
#   1. Classifier Docker container (port 8000)
#   2. Elysia API server (port 3001)
#   3. Next.js dev server (port 3000)
#
# Usage: bun run dev:all
# Stop:  Ctrl+C (stops all services including classifier container)

set -e

CLASSIFIER_CONTAINER="smry-classifier"
CLASSIFIER_IMAGE="smry-classifier"
CLASSIFIER_PORT=8000

cleanup() {
  echo ""
  echo "Stopping services..."
  # Kill background processes
  kill $APP_PID 2>/dev/null || true
  kill $NEXT_PID 2>/dev/null || true
  # Stop classifier container
  docker stop "$CLASSIFIER_CONTAINER" 2>/dev/null || true
  echo "All services stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM

# --- Classifier ---
# Build image if it doesn't exist
if ! docker image inspect "$CLASSIFIER_IMAGE" >/dev/null 2>&1; then
  echo "Building classifier Docker image..."
  docker build -t "$CLASSIFIER_IMAGE" ./classifier
fi

# Stop existing container if running
if docker ps -q -f name="$CLASSIFIER_CONTAINER" | grep -q .; then
  echo "Stopping existing classifier container..."
  docker stop "$CLASSIFIER_CONTAINER" >/dev/null 2>&1
  sleep 1
fi

# Remove stopped container with same name
docker rm "$CLASSIFIER_CONTAINER" 2>/dev/null || true

echo "Starting classifier on port $CLASSIFIER_PORT..."
docker run --rm -d \
  --name "$CLASSIFIER_CONTAINER" \
  -p "$CLASSIFIER_PORT:8000" \
  "$CLASSIFIER_IMAGE" >/dev/null

# Wait for classifier to be healthy
echo -n "Waiting for classifier health check"
for i in $(seq 1 20); do
  if curl -sf "http://localhost:$CLASSIFIER_PORT/health" >/dev/null 2>&1; then
    echo " ready!"
    break
  fi
  echo -n "."
  sleep 1
done

if ! curl -sf "http://localhost:$CLASSIFIER_PORT/health" >/dev/null 2>&1; then
  echo " FAILED (continuing without classifier)"
fi

# --- App (Elysia + Next.js) ---
echo "Starting app (Elysia + Next.js)..."
export CLASSIFIER_URL="http://localhost:$CLASSIFIER_PORT"
export CLASSIFIER_ENABLED="true"

# Start Elysia + Next.js (same as original dev command)
bun run --watch server/index.ts & APP_PID=$!
next dev &
NEXT_PID=$!

echo ""
echo "=== SMRY Dev Environment ==="
echo "  App:        http://localhost:3000"
echo "  API:        http://localhost:3001"
echo "  Classifier: http://localhost:$CLASSIFIER_PORT"
echo "  Press Ctrl+C to stop all services"
echo "============================="
echo ""

# Wait for any child to exit
wait $APP_PID $NEXT_PID 2>/dev/null
cleanup
