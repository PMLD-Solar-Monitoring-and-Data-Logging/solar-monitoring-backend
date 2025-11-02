#!/bin/bash

# wait until $TB_BASE_URL is reachable
until curl -s $TB_BASE_URL > /dev/null; do
  echo "Waiting for $TB_BASE_URL to be reachable..."
  sleep 5
done

# Start bot in the background
bun bot &

# Start web in the foreground
bun run .output/server/index.mjs