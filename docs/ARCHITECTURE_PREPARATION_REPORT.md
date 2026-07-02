# Rapport de preparation architecture

Date: 2026-07-02

## Objectif

Preparer HKids pour evoluer vers le MVP "Le Lit Qui Lit" sans ajouter de nouvelles fonctionnalites et sans modifier le design existant.

## Structure actuelle

### Racine

- `.agents`, `.codex`: configuration et contexte local des agents.
- `.git`: historique Git du projet.
- `backend`: API Express, base de donnees, uploads et scripts serveur.
- `docs`: documentation projet, roadmap et rapports.
- `frontend`: application React/Vite.
- `scripts`: scripts utilitaires racine pour generation de contenus de test.
- `docker-compose.yml`: orchestration locale.
- `package.json`: scripts racine pour lancer, installer et builder les sous-projets.

### Backend

- `api`: point d'entree serveur adapte au deploiement serverless.
- `config`: configuration d'environnement et clients externes.
- `constants`: constantes backend partagees.
- `data`: donnees locales ou exemples.
- `database`: initialisation et schema SQL applique par l'application.
- `middleware`: middlewares Express reutilisables.
- `routes`: routes HTTP par domaine: auth, livres, categories, parents, abonnements, newsletter.
- `scripts`: scripts d'administration et maintenance.
- `services`: future couche metier backend.
- `types`: contrats JSDoc ou future migration TypeScript.
- `uploads`: fichiers utilisateur stockes localement.
- `utils`: helpers backend generiques.

### Frontend

- `src/api`: adaptateurs HTTP REST.
- `src/assets`: assets statiques frontend.
- `src/components`: composants UI reutilisables.
- `src/components/admin`: composants dedies au dashboard admin.
- `src/config`: configuration API frontend.
- `src/constants`: constantes partagees entre pages et composants.
- `src/context`: providers React globaux.
- `src/hooks`: futurs hooks React reutilisables.
- `src/pages`: pages routees par React Router.
- `src/services`: future couche d'orchestration metier frontend.
- `src/types`: typedefs JSDoc ou future migration TypeScript.
- `src/utils`: fonctions utilitaires pures.

## Modifications effectuees

- Ajout de dossiers d'architecture manquants avec README: `hooks`, `services`, `assets`, `constants`, `types`, `utils` selon le cote frontend/backend.
- Centralisation des options de contenus, langues et themes dans `frontend/src/constants/contentOptions.js`.
- Raccordement de `BookManagement`, `ParentDashboard` et d'une partie de `KidsLibrary` aux constantes partagees.
- Nettoyage de code mort dans `BookManagement`: suppression d'un helper de normalisation d'image inutilise et des logs de debug au montage.
- Conservation du design existant: seules des sources de donnees internes ont ete deplacees.
- Nettoyage des dependances non utilisees:
  - Backend: retrait de `path` package npm, `pdfjs-dist`, `tesseract.js`, `nodemon`.
  - Frontend: retrait de `@types/react` et `@types/react-dom`, car le projet est actuellement en JavaScript.

## Dependances conservees

### Backend

- `@supabase/supabase-js`: client Supabase.
- `bcryptjs`: hash des mots de passe.
- `cors`, `dotenv`, `express`: socle API.
- `fs-extra`: operations fichiers existantes.
- `jsonwebtoken`: authentification JWT.
- `multer`: uploads de fichiers.
- `pg`: acces PostgreSQL.

### Frontend

- `axios`: appels HTTP.
- `framer-motion`: animations existantes.
- `pdfjs-dist`: lecteur PDF.
- `react`, `react-dom`, `react-router-dom`: socle React.
- `tesseract.js`: OCR du lecteur.
- `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `@vitejs/plugin-react`: build et styles.

## Preparation pour les futures fonctionnalites

- Authentification: garder `context/AuthContext.jsx`, `backend/routes/auth.js` et isoler les prochaines regles dans services/middleware.
- Profils enfants: garder le domaine parental dans `api/parental.js`, `routes/parental.js`, puis extraire la logique complexe vers `services`.
- IA: ajouter les futurs appels modeles dans `backend/services` et exposer seulement des routes fines.
- Controle parental: centraliser les constantes et deplacer les regles complexes hors des composants.
- Bibliotheque audio: garder les fichiers et formats dans constantes backend/frontend quand le domaine grandira.
- Dashboard Admin: garder `components/admin` pour les modules admin et eviter de grossir les pages.
- Abonnements: conserver `routes/subscriptions.js` et `api/subscriptions.js`, extraire la logique paiement dans `services`.

## Ce qui reste a faire

- Normaliser l'encodage de certains fichiers frontend avant un nettoyage plus agressif du code legacy.
- Retirer ensuite le helper legacy `getImageBaseUrl` de `BookManagement` lorsque l'encodage du fichier aura ete stabilise.
- Extraire progressivement les grosses pages (`ParentDashboard`, `KidsLibrary`, `BookManagement`) en composants plus petits.
- Ajouter des hooks dedies: `useKids`, `useBooks`, `useAudioPlayer`, `useParentalRules`.
- Ajouter des services backend pour separer la logique metier des routes Express.
- Ajouter une verification de lint pour detecter automatiquement imports et variables inutilises.
- Ajouter des tests unitaires ou integration sur les routes critiques.

## Points a ameliorer

- Plusieurs fichiers contiennent encore du texte encode de maniere incoherente; cela rend les patchs et reviews moins fiables.
- Les pages frontend portent encore beaucoup de logique metier.
- Les contrats API sont implicites; des typedefs JSDoc ou TypeScript reduiraient les regressions.
- Les uploads locaux devront etre abstraits si le projet passe sur un stockage cloud durable.
