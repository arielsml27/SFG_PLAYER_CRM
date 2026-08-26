#!/bin/sh
set -e

# Persistent volume (mounted at /data) holds the SQLite file and uploaded
# player photos so they survive redeploys/restarts. DATABASE_FILE already
# points at /data/dev.db (see Dockerfile); the uploads folder is symlinked
# into place here because the app code hardcodes public/uploads/players.
mkdir -p /data/uploads/players /data/uploads/clubs
rm -rf /app/public/uploads
ln -s /data/uploads /app/public/uploads

node scripts/migrate.mjs
exec node server.js
