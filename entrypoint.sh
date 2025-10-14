#!/bin/bash

# Start bun start in the background
bun run .output/server/index.mjs &

# Start bun bot in the foreground
bun bot