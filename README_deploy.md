# 🚀 fleet_backend — NestJS API

> API backend du projet Fleet, déployée sur DigitalOcean avec PM2, Redis, Prisma et Nginx.

---

## 📋 Table des matières

- [Stack technique](#-stack-technique)
- [Prérequis](#-prérequis)
- [Installation locale](#-installation-locale)
- [Variables d'environnement](#-variables-denvironnement)
- [Déploiement sur DigitalOcean](#-déploiement-sur-digitalocean)
- [CI/CD GitHub Actions](#-cicd-github-actions)
- [Commandes utiles](#-commandes-utiles)
- [Résolution des erreurs courantes](#-résolution-des-erreurs-courantes)

---

## 🛠 Stack technique

| Technologie | Rôle |
|---|---|
| NestJS | Framework backend |
| Prisma ORM | Accès base de données |
| Redis | Cache & sessions |
| PM2 | Gestionnaire de processus |
| Nginx | Reverse proxy |
| GitHub Actions | CI/CD automatique |

---

## ✅ Prérequis

- Node.js **≥ 20**
- npm **≥ 9**
- Accès SSH au Droplet DigitalOcean
- Redis installé sur le serveur
- Base de données PostgreSQL configurée

---

## 💻 Installation locale

```bash
# Cloner le projet
git clone https://github.com/VOTRE_USER/fleet_backend.git
cd fleet_backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Démarrer en développement
npm run start:dev
```

---

## 🔐 Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Application
PORT=3000
NODE_ENV=development

# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/fleet_db

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

> ⚠️ Ne commitez jamais le fichier `.env` dans Git.

---

## 🌐 Déploiement sur DigitalOcean

Le serveur héberge également **Traccar** (port 8082). Vérifiez qu'il n'y a pas de conflit de ports.

### Ports utilisés sur le Droplet

| Service | Port |
|---|---|
| Traccar | 8082 |
| NestJS API | 3000 |
| Redis | 6379 |
| Nginx | 80 / 443 |

### 1. Connexion SSH

```bash
ssh root@VOTRE_IP_DROPLET
```

### 2. Installer Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Installer PM2

```bash
npm install -g pm2
```

### 4. Installer Redis

```bash
sudo apt update
sudo apt install redis-server -y

# ⚠️ Sur Ubuntu, utiliser redis-server (pas redis)
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Vérifier
redis-cli ping   # → PONG
```

### 5. Cloner et configurer le projet

```bash
cd /var/www
git clone https://github.com/VOTRE_USER/fleet_backend.git
cd fleet_backend

cp .env.example .env
nano .env   # Renseigner les variables de production
```

### 6. Installer, générer et builder

```bash
npm install
npx prisma generate      # ⚠️ Obligatoire sur chaque nouveau serveur
npx prisma migrate deploy
npm run build
```

### 7. Lancer avec PM2

```bash
pm2 start dist/main.js --name "nestjs-api"
pm2 save
pm2 startup   # → Exécuter la commande affichée
```

### 8. Configurer Nginx

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/nestjs-api
```

```nginx
server {
    listen 80;
    server_name VOTRE_DOMAINE_OU_IP;

    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nestjs-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ⚙️ CI/CD GitHub Actions

Chaque `git push` sur `main` déclenche automatiquement le déploiement.

### Configuration des secrets GitHub

Dans **Settings → Secrets and variables → Actions**, ajoutez :

| Secret | Valeur |
|---|---|
| `DROPLET_IP` | Adresse IP du Droplet |
| `SSH_PRIVATE_KEY` | Contenu de `~/.ssh/id_rsa` |

### Fichier `.github/workflows/deploy.yml`

```yaml
name: Deploy NestJS to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/fleet_backend
            git pull origin main
            npm install
            npx prisma generate
            npm run build
            pm2 restart nestjs-api
```

### Mise à jour manuelle (sans CI/CD)

```bash
cd /var/www/fleet_backend
git pull origin main
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart nestjs-api
```

---

## 🧰 Commandes utiles

```bash
# Statut de l'application
pm2 status

# Logs en temps réel
pm2 logs nestjs-api

# 50 dernières lignes de logs
pm2 logs nestjs-api --lines 50

# Redémarrer
pm2 restart nestjs-api

# Dashboard de monitoring
pm2 monit

# Statut Redis
sudo systemctl status redis-server

# Statut Nginx
sudo systemctl status nginx
```

---

## 🐛 Résolution des erreurs courantes

### `@prisma/client did not initialize yet`

```bash
npx prisma generate
pm2 restart nestjs-api
```

> Le client Prisma doit être généré sur chaque machine. Il n'est pas transféré par Git.

---

### `Redis connection error`

```bash
sudo systemctl status redis-server
sudo systemctl start redis-server
redis-cli ping   # doit répondre PONG
```

Vérifiez aussi votre `.env` :
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

### `Refusing to operate on alias redis.service`

```bash
# ✅ Correct
sudo systemctl enable redis-server

# ❌ Incorrect
sudo systemctl enable redis
```

---

### Port 3000 déjà utilisé

```bash
sudo lsof -i :3000
```

Changez le port dans `.env` si nécessaire :
```env
PORT=3001
```

---

## 📁 Structure du projet

```
fleet_backend/
├── src/
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── prisma.service.ts
│   └── ...
├── dist/               # Build de production
├── prisma/
│   └── schema.prisma
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .env.example
└── README.md
```

---

> Généré le <!-- DATE --> — fleet_backend v1.0