# Scripts Windows

Ce dossier contient tous les scripts Windows (.bat et .ps1) pour faciliter la gestion du projet.

## Scripts disponibles

### Scripts Batch (.bat)

- **redemarrer-backend.bat** - Redémarre le serveur backend
- **start-all.bat** - Démarre tous les serveurs (backend + frontend)

### Scripts PowerShell (.ps1)

- **force-restart-backend.ps1** - Force le redémarrage du backend
- **restart-backend-now.ps1** - Redémarre le backend immédiatement
- **restart-backend.ps1** - Redémarre le backend
- **start-all.ps1** - Démarre tous les serveurs

## Utilisation

### Pour les scripts .bat
Double-cliquez sur le fichier ou exécutez dans PowerShell :
```powershell
.\scripts\windows\nom-du-script.bat
```

### Pour les scripts .ps1
Exécutez dans PowerShell :
```powershell
.\scripts\windows\nom-du-script.ps1
```

Si vous obtenez une erreur d'exécution, vous devrez peut-être modifier la politique d'exécution :
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Recommandations

- Utilisez `start-all.bat` ou `start-all.ps1` pour démarrer facilement tous les serveurs
- Utilisez `redemarrer-backend.bat` si vous rencontrez des problèmes avec le backend

