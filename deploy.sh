#!/usr/bin/env bash
#
# Tezkor Slide AI — server deploy script.
# Builds backend + mini-app + web and (re)starts the app with PM2.
#
# Run AFTER `git pull`. Used by .github/workflows/deploy.yml.
# Manual deploy:  cd /var/www/tezkor-slide && git pull origin main && bash deploy.sh
#
set -euo pipefail
cd "$(dirname "$0")"

echo "▶ [1/4] Backend dependencies + build"
npm ci
npm run build

echo "▶ [2/4] Mini App build (served at /mini-app)"
( cd mini-app && npm ci && npm run build )

echo "▶ [3/4] Web build (landing + admin, served at /)"
( cd web && npm ci && npm run build )

echo "▶ [4/4] (Re)start with PM2"
if pm2 describe tezkor-slide > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi
pm2 save

echo "✅ Deploy complete"
