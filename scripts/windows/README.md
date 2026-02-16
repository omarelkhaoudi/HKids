# Scripts Windows

Scripts PowerShell pour gérer le projet HKids sur Windows.

## Scripts disponibles

### `start.ps1`
Script principal de démarrage. Démarre automatiquement le backend et le frontend dans des fenêtres séparées.

**Utilisation :**
```powershell
.\scripts\windows\start.ps1
```

**Fonctionnalités :**
- Vérifie que PostgreSQL est en cours d'exécution
- Crée le fichier `.env` s'il n'existe pas
- Démarre le backend sur http://localhost:3000
- Démarre le frontend sur http://localhost:5173

## Prérequis

- Node.js installé
- PostgreSQL en cours d'exécution sur le port 5432
- Les dépendances installées (`npm install` dans `backend/` et `frontend/`)
