#!/bin/bash
# Déploiement de l'API sur le serveur (voir README_deploy.md).
# Usage : ./deploy.sh
set -euo pipefail   # arrête tout si une commande échoue

APP_DIR=/var/www/fleet_backend
PM2_NAME=nestjs-api
BRANCH=main
HEALTH_URL=http://127.0.0.1:3000

cd "$APP_DIR"

# --ff-only : refuse de créer un commit de merge si l'historique du serveur a divergé
git pull --ff-only origin "$BRANCH"
npm ci
npx prisma generate          # aucun postinstall ne le fait
npx prisma migrate deploy
npm run build

# reload sans coupure ; premier déploiement : le processus n'existe pas encore
pm2 reload "$PM2_NAME" || pm2 start dist/main.js --name "$PM2_NAME"
pm2 save

# L'API met quelques secondes à démarrer : on réessaie pendant 30 s
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "$HEALTH_URL"; then
    echo "✅ API en ligne ($(git rev-parse --short HEAD))"
    exit 0
  fi
  sleep 1
done

echo "❌ L'API ne répond pas sur $HEALTH_URL — voir : pm2 logs $PM2_NAME --lines 50"
exit 1
