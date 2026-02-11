# Guide de Déploiement - HKids

## Prérequis

- Node.js 18+ et npm
- Git (optionnel)

## Installation Locale

### 1. Installation des dépendances

```bash
# À la racine du projet
npm run install:all
```

Cette commande installe les dépendances pour:
- Le projet racine
- Le backend
- Le frontend

### 2. Initialisation de la base de données

La base de données SQLite sera créée automatiquement au premier démarrage du serveur backend.

### 3. Démarrage en mode développement

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

Le backend démarre sur `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

Le frontend démarre sur `http://localhost:5173`

### 4. Accès à l'application

- **Application**: http://localhost:5173
- **API**: http://localhost:3000/api
- **Admin Panel**: http://localhost:5173/admin/login

**Identifiants par défaut:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: Changez le mot de passe par défaut en production!

## Structure des Fichiers

```
HKids/
├── backend/
│   ├── data/              # Base de données SQLite (créée automatiquement)
│   ├── uploads/           # Fichiers uploadés (créé automatiquement)
│   └── ...
├── frontend/
│   ├── dist/              # Build de production (après npm run build)
│   └── ...
└── ...
```

## Build de Production

### Frontend

```bash
cd frontend
npm run build
```

Les fichiers de production sont générés dans `frontend/dist/`

### Backend

Le backend Node.js n'a pas besoin de build, mais vous pouvez optimiser avec:

```bash
cd backend
npm install --production
```

## Déploiement

### Option 1: Serveur Traditionnel (VPS/Dedicated)

#### Prérequis serveur
- Node.js 18+
- PM2 (process manager)
- Nginx (reverse proxy)
- SSL certificate (Let's Encrypt)

#### Étapes

1. **Cloner le projet sur le serveur:**
```bash
git clone <repository-url>
cd HKids
npm run install:all
```

2. **Build du frontend:**
```bash
cd frontend
npm run build
```

3. **Configurer PM2 pour le backend:**
```bash
cd backend
pm2 start server.js --name hkids-backend
pm2 save
pm2 startup
```

4. **Configurer Nginx:**

```nginx
# /etc/nginx/sites-available/hkids
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/HKids/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /path/to/HKids/backend/uploads;
    }
}
```

5. **Activer le site:**
```bash
sudo ln -s /etc/nginx/sites-available/hkids /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. **Configurer SSL (Let's Encrypt):**
```bash
sudo certbot --nginx -d your-domain.com
```

### Option 2: Docker

#### Dockerfile Backend

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### Dockerfile Frontend

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend/data:/app/data
      - ./backend/uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - PORT=3000

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

#### Déploiement Docker

```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Heroku

1. Créer `Procfile` à la racine:
```
web: cd backend && node server.js
```

2. Déployer:
```bash
heroku create hkids-app
git push heroku main
```

#### AWS / Google Cloud / Azure

Utiliser les services de conteneurs (ECS, Cloud Run, Container Instances) avec les Dockerfiles fournis.

## Variables d'Environnement

Créer un fichier `.env` dans `backend/`:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key-change-this
```

⚠️ **Important**: Utilisez un JWT_SECRET fort et unique en production!

## Base de Données en Production

### Migration vers PostgreSQL

1. **Installer PostgreSQL**

2. **Créer la base de données:**
```sql
CREATE DATABASE hkids;
```

3. **Exporter SQLite vers PostgreSQL:**
```bash
# Utiliser un outil comme sqlite3-to-postgres
sqlite3 data/hkids.db .dump | psql hkids
```

4. **Modifier backend/database/init.js** pour utiliser PostgreSQL:
```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

## Sécurité en Production

1. **Changer le mot de passe admin par défaut**
2. **Utiliser HTTPS uniquement**
3. **Configurer CORS correctement**
4. **Limiter la taille des uploads**
5. **Valider tous les inputs**
6. **Utiliser des variables d'environnement pour les secrets**
7. **Activer rate limiting**
8. **Configurer des backups réguliers**
9. **Monitorer les logs**
10. **Mettre à jour les dépendances régulièrement**

## Monitoring

### PM2 Monitoring

```bash
pm2 monit
pm2 logs
```

### Health Check

L'endpoint `/api/health` peut être utilisé pour vérifier que l'API fonctionne.

## Backup

### Base de données SQLite

```bash
# Backup simple
cp backend/data/hkids.db backend/data/hkids.db.backup

# Backup automatique (cron)
0 2 * * * cp /path/to/HKids/backend/data/hkids.db /backups/hkids-$(date +\%Y\%m\%d).db
```

### Fichiers uploadés

```bash
# Backup des uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/
```

## Troubleshooting

### Le backend ne démarre pas

- Vérifier que le port 3000 n'est pas utilisé
- Vérifier les logs: `cd backend && node server.js`
- Vérifier que Node.js 18+ est installé

### Le frontend ne se connecte pas à l'API

- Vérifier que le backend est démarré
- Vérifier la configuration du proxy dans `vite.config.js`
- Vérifier les CORS dans `backend/server.js`

### Erreurs de base de données

- Vérifier les permissions sur `backend/data/`
- Supprimer `backend/data/hkids.db` pour réinitialiser

### Problèmes d'upload

- Vérifier les permissions sur `backend/uploads/`
- Vérifier la taille maximale des fichiers (50MB par défaut)

## Support

Pour toute question ou problème, consulter:
- Documentation technique: `/docs/ARCHITECTURE.md`
- Documentation API: `/docs/API_DOCUMENTATION.md`

