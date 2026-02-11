# Guide de Démarrage Rapide - HKids

## 🚀 Démarrage en 3 Étapes

### Étape 1: Installation
```bash
npm run install:all
```

### Étape 2: Démarrer les Serveurs

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

### Étape 3: Accéder à l'Application

- **Application**: http://localhost:5173
- **Admin**: http://localhost:5173/admin/login
  - Username: `admin`
  - Password: `admin123`

---

## ✅ Vérification Rapide

1. ✅ Backend démarré sur http://localhost:3000
2. ✅ Frontend démarré sur http://localhost:5173
3. ✅ Base de données initialisée automatiquement
4. ✅ Compte admin créé par défaut

---

## 📚 Première Utilisation

### En tant qu'Admin

1. Connectez-vous sur http://localhost:5173/admin/login
2. Créez une catégorie (ex: "Aventure")
3. Ajoutez un livre:
   - Titre, auteur, description
   - Sélectionnez la catégorie
   - Définissez le groupe d'âge
   - Uploadez une couverture
   - Uploadez les pages (images multiples)
   - Cochez "Publish immediately"
4. Sauvegardez

### En tant qu'Utilisateur

1. Allez sur http://localhost:5173
2. Filtrez par catégorie ou âge (optionnel)
3. Cliquez sur un livre pour le lire
4. Naviguez avec:
   - Flèches gauche/droite (clavier)
   - Swipe gauche/droite (tactile)
   - Boutons de navigation

---

## 🐛 Dépannage Rapide

### Le backend ne démarre pas
- Vérifiez que le port 3000 est libre
- Vérifiez que Node.js 18+ est installé

### Le frontend ne se connecte pas
- Vérifiez que le backend est démarré
- Vérifiez la console du navigateur (F12)

### Erreur de base de données
- Supprimez `backend/data/hkids.db`
- Redémarrez le backend (la base sera recréée)

---

## 📖 Documentation Complète

- **Configuration**: Voir `SETUP.md`
- **Déploiement**: Voir `docs/DEPLOYMENT.md`
- **Architecture**: Voir `docs/ARCHITECTURE.md`
- **API**: Voir `docs/API_DOCUMENTATION.md`

---

**Bon développement ! 🎉**

