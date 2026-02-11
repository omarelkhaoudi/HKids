# 🐳 Guide Docker - HKids

## Démarrage Rapide

### Avec Docker Compose (Recommandé)

```bash
# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Services

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

---

## Configuration

### Variables d'Environnement

Créer un fichier `.env` à la racine:

```env
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:5173
NODE_ENV=production
```

### Volumes

Les données sont persistantes via des volumes:
- `./backend/uploads` - Fichiers uploadés
- `./backend/data` - Base de données SQLite

---

## Build Manuel

### Backend

```bash
cd backend
docker build -t hkids-backend .
docker run -p 3000:3000 hkids-backend
```

### Frontend

```bash
cd frontend
docker build -t hkids-frontend .
docker run -p 80:80 hkids-frontend
```

---

## Production

Pour la production, modifier `docker-compose.yml`:

1. Changer les ports si nécessaire
2. Ajouter des variables d'environnement sécurisées
3. Configurer un reverse proxy (nginx/traefik)
4. Ajouter SSL/TLS

---

## Health Checks

Le backend inclut un endpoint de health check:

```bash
curl http://localhost:3000/api/health
```

Réponse:
```json
{
  "status": "ok",
  "message": "HKids API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

---

## Troubleshooting

### Port déjà utilisé

Modifier les ports dans `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Backend sur 3001
  - "5174:5173"  # Frontend sur 5174
```

### Permissions

Sur Linux, vous pourriez avoir besoin de:

```bash
sudo chown -R $USER:$USER backend/uploads backend/data
```

---

## Notes

- Les images Docker sont optimisées (multi-stage pour frontend)
- Nginx est configuré pour le frontend en production
- Health checks sont inclus pour monitoring

