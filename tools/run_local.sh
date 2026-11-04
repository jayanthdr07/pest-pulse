#!/bin/sh
# Run PestPulse Cloud on this computer (no Docker): http://localhost:8080
cd "$(dirname "$0")/../cloud" && PP_ALLOW_BACKFILL=1 exec python3 app.py
