#!/bin/bash
set -e

# Zero-downtime blue-green deploy.
# Both old and new containers run simultaneously on the shared "smry" network.
# Caddy routes to whichever responds. Once new is healthy, old is removed.

cd /opt/smry

ACTIVE_FILE="/opt/smry/.active-slot"
COMPOSE="docker compose -f docker-compose.prod.yml"

# Determine active/new slots
ACTIVE=$(cat "$ACTIVE_FILE" 2>/dev/null || echo "blue")
if [ "$ACTIVE" = "blue" ]; then NEW="green"; else NEW="blue"; fi

echo "Active: $ACTIVE → Deploying: $NEW"

# Ensure shared network exists (Caddy + all app containers share this)
docker network create smry 2>/dev/null || true

# Ensure Caddy is running (independent of app deploys)
docker compose -f docker-compose.caddy.yml up -d

# Build new images
echo "Building images..."
$COMPOSE build

# Start new classifier first (others depend on it)
echo "Starting $NEW stack..."
$COMPOSE -p "smry-$NEW" up -d --no-deps classifier
echo "Waiting for classifier health..."

# Wait for classifier to be healthy (up to 60s)
for i in $(seq 1 30); do
  STATUS=$($COMPOSE -p "smry-$NEW" ps classifier --format json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin).get('Health',''))" 2>/dev/null || echo "")
  if [ "$STATUS" = "healthy" ]; then
    echo "Classifier healthy"
    break
  fi
  sleep 2
done

# Start api and app (both join the "smry" network with service name aliases)
$COMPOSE -p "smry-$NEW" up -d --no-deps api app
echo "Waiting for new services to start..."
sleep 8

# Health check the new deployment through Caddy
echo "Checking health..."
HEALTHY=false
for i in 1 2 3 4 5; do
  if curl -sf https://api.smry.ai/health | grep -q '"status":"ok"'; then
    HEALTHY=true
    echo "New deployment is healthy"
    break
  fi
  echo "Attempt $i: waiting..."
  sleep 3
done

if [ "$HEALTHY" != "true" ]; then
  echo "New deployment unhealthy — rolling back"
  $COMPOSE -p "smry-$NEW" down
  exit 1
fi

# Remove old stack (Caddy stays running, only app containers are swapped)
echo "Removing old $ACTIVE stack..."
$COMPOSE -p "smry-$ACTIVE" down 2>/dev/null || true

# Clean up any orphaned project networks (compose creates them even with external)
docker network rm "smry-${ACTIVE}_smry" 2>/dev/null || true

# Record active slot
echo "$NEW" > "$ACTIVE_FILE"
echo "Deploy complete: $NEW is now active"

# Cleanup old images
docker image prune -f
