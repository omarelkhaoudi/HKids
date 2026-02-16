# Architecture du Projet HKids

## Structure du Projet

```
HKids/
├── backend/                    # Serveur API Express
│   ├── config/                 # Configuration
│   │   └── env.js             # Variables d'environnement
│   ├── database/              # Base de données
│   │   └── init.js            # Initialisation PostgreSQL
│   ├── middleware/            # Middleware Express
│   │   ├── errorHandler.js    # Gestion des erreurs
│   │   ├── logger.js          # Logging
│   │   ├── rateLimiter.js     # Limitation de débit
│   │   └── validator.js       # Validation des données
│   ├── routes/                # Routes API
│   │   ├── auth.js            # Authentification
│   │   ├── books.js           # Gestion des livres
│   │   └── categories.js      # Gestion des catégories
│   ├── scripts/               # Scripts utilitaires
│   │   └── reset-admin.js     # Réinitialisation admin
│   ├── uploads/               # Fichiers uploadés
│   │   └── books/             # Livres (covers + pages)
│   ├── env.example            # Exemple de configuration
│   ├── Dockerfile             # Configuration Docker
│   └── server.js              # Point d'entrée serveur
│
├── frontend/                   # Application React
│   ├── src/
│   │   ├── api/               # Client API
│   │   │   └── books.js       # Appels API
│   │   ├── components/        # Composants React
│   │   │   ├── admin/         # Composants admin
│   │   │   │   ├── BookManagement.jsx
│   │   │   │   └── CategoryManagement.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Icons.jsx
│   │   │   ├── LanguageSelector.jsx
│   │   │   ├── LibraryMenu.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── ReadingAidPanel.jsx
│   │   │   ├── SkeletonLoader.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── ToastProvider.jsx
│   │   ├── context/           # Context React
│   │   │   ├── AuthContext.jsx
│   │   │   └── LanguageContext.jsx
│   │   ├── pages/             # Pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── BookDetails.jsx
│   │   │   ├── BookReader.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── FeatureDetails.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Home.jsx
│   │   │   └── SignUp.jsx
│   │   ├── utils/             # Utilitaires
│   │   │   ├── storage.js     # Gestion localStorage
│   │   │   └── translations.js # Traductions i18n
│   │   ├── App.jsx            # Composant principal
│   │   ├── index.css          # Styles globaux
│   │   └── main.jsx           # Point d'entrée
│   ├── public/                # Assets statiques
│   ├── Dockerfile             # Configuration Docker
│   ├── nginx.conf             # Configuration Nginx
│   ├── tailwind.config.js     # Configuration Tailwind
│   └── vite.config.js         # Configuration Vite
│
├── scripts/                   # Scripts du projet
│   ├── windows/               # Scripts Windows
│   │   ├── start.ps1          # Script de démarrage
│   │   └── README.md          # Documentation scripts
│   └── create-database.sql    # Script SQL de création DB
│
├── docs/                      # Documentation
│   ├── guides/                # Guides utilisateur
│   ├── troubleshooting/       # Dépannage
│   ├── API_DOCUMENTATION.md   # Documentation API
│   ├── ARCHITECTURE.md        # Architecture (ce fichier)
│   ├── DEPLOYMENT.md          # Guide de déploiement
│   ├── STACK_JUSTIFICATION.md # Justification stack
│   └── REQUIREMENTS_CHECKLIST.md
│
├── docker-compose.yml         # Configuration Docker Compose
├── .gitignore                 # Fichiers ignorés par Git
└── README.md                  # Documentation principale
```

## Technologies Utilisées

### Backend
- **Node.js** + **Express** : Serveur API REST
- **PostgreSQL** : Base de données relationnelle
- **JWT** : Authentification
- **Multer** : Upload de fichiers
- **bcryptjs** : Hachage de mots de passe

### Frontend
- **React 18** : Framework UI
- **Vite** : Build tool
- **React Router** : Navigation
- **Tailwind CSS** : Styling
- **Framer Motion** : Animations
- **Axios** : Client HTTP

## Flux de Données

1. **Frontend** → Appels API via `src/api/books.js`
2. **Backend** → Routes dans `routes/` → Middleware → Base de données
3. **Base de données** → PostgreSQL avec pool de connexions
4. **Authentification** → JWT tokens stockés dans localStorage

## Séparation des Responsabilités

- **Backend** : API REST, logique métier, base de données
- **Frontend** : Interface utilisateur, gestion d'état, routing
- **Scripts** : Automatisation, utilitaires
- **Docs** : Documentation technique et utilisateur

