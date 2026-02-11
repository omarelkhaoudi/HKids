# Guide de Configuration Rapide - HKids

## Installation

### 1. Prérequis

Assurez-vous d'avoir installé:
- **Node.js** version 18 ou supérieure
- **npm** (inclus avec Node.js)

Vérifier l'installation:
```bash
node --version  # Doit afficher v18.x ou supérieur
npm --version
```

### 2. Installation des Dépendances

À la racine du projet, exécutez:

```bash
npm run install:all
```

Cette commande installe automatiquement toutes les dépendances pour:
- Le projet racine
- Le backend (Node.js/Express)
- Le frontend (React/Vite)

### 3. Configuration (Optionnel)

Pour personnaliser la configuration du backend, copiez le fichier d'exemple:

```bash
cd backend
cp env.example .env
```

Puis éditez `.env` selon vos besoins.

## Démarrage

### Mode Développement

Ouvrez **deux terminaux**:

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

Vous devriez voir:
```
🚀 HKids Backend running on http://localhost:3000
✅ Database initialized with default admin (username: admin, password: admin123)
✅ Database tables created
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

Vous devriez voir:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Accès à l'Application

- **Application principale**: http://localhost:5173
- **API Backend**: http://localhost:3000/api
- **Panel Admin**: http://localhost:5173/admin/login

**Identifiants par défaut:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: Changez ce mot de passe en production!

## Premiers Pas

### 1. Se connecter en tant qu'admin

1. Allez sur http://localhost:5173/admin/login
2. Connectez-vous avec les identifiants par défaut
3. Vous accédez au tableau de bord admin

### 2. Créer une catégorie

1. Dans le panel admin, cliquez sur "Categories"
2. Cliquez sur "+ Add New Category"
3. Remplissez le formulaire et sauvegardez

### 3. Ajouter un livre

1. Dans le panel admin, cliquez sur "Books"
2. Cliquez sur "+ Add New Book"
3. Remplissez les informations:
   - Titre (obligatoire)
   - Auteur (optionnel)
   - Description (optionnel)
   - Catégorie (optionnel)
   - Groupe d'âge (optionnel)
   - Image de couverture (optionnel)
   - Pages du livre (images multiples)
4. Cochez "Publish immediately" si vous voulez que le livre soit visible
5. Cliquez sur "Create Book"

### 4. Lire un livre

1. Retournez sur la page d'accueil (http://localhost:5173)
2. Cliquez sur un livre publié
3. Utilisez les flèches pour naviguer entre les pages

## Structure des Fichiers Créés

Après le premier démarrage, les dossiers suivants seront créés automatiquement:

```
HKids/
├── backend/
│   ├── data/
│   │   └── hkids.db          # Base de données SQLite
│   └── uploads/
│       └── books/            # Fichiers uploadés (covers, pages)
└── ...
```

## Dépannage

### Le backend ne démarre pas

**Erreur: Port déjà utilisé**
```bash
# Windows
netstat -ano | findstr :3000
# Linux/Mac
lsof -i :3000
```

Changez le port dans `backend/.env` ou arrêtez le processus qui utilise le port.

**Erreur: Module non trouvé**
```bash
cd backend
npm install
```

### Le frontend ne se connecte pas à l'API

1. Vérifiez que le backend est démarré
2. Vérifiez que le backend écoute sur le port 3000
3. Vérifiez la console du navigateur pour les erreurs

### Erreurs de base de données

Si la base de données est corrompue, supprimez-la et redémarrez:

```bash
# Windows
del backend\data\hkids.db

# Linux/Mac
rm backend/data/hkids.db
```

Puis redémarrez le backend. La base sera recréée automatiquement.

### Problèmes d'upload de fichiers

1. Vérifiez que le dossier `backend/uploads/` existe et est accessible en écriture
2. Vérifiez la taille des fichiers (limite: 50MB par défaut)
3. Vérifiez le type de fichier (images: jpg, png, gif)

## Commandes Utiles

```bash
# Installer toutes les dépendances
npm run install:all

# Démarrer le backend
npm run dev:backend

# Démarrer le frontend
npm run dev:frontend

# Build de production (frontend)
cd frontend && npm run build
```

## Prochaines Étapes

1. ✅ Lire la [Documentation Technique](./docs/README.md)
2. ✅ Consulter le [Guide de Déploiement](./docs/DEPLOYMENT.md)
3. ✅ Explorer l'[Architecture](./docs/ARCHITECTURE.md)
4. ✅ Voir la [Documentation API](./docs/API_DOCUMENTATION.md)

## Support

Pour toute question:
- Consultez la documentation dans `/docs`
- Vérifiez les logs du backend et du frontend
- Consultez la console du navigateur (F12)

