# Le Lit Qui Lit - Feuille de route step by step

Version: 1.0  
Date: 2026-07-02  
Repo: HKids

## Decision projet

On continue sur le repo HKids actuel. Il contient deja les fondations utiles:

- frontend React/Vite;
- backend Express/PostgreSQL;
- roles `admin`, `parent`, `kid`;
- gestion des livres et categories;
- profils enfants;
- espace parent;
- espace admin;
- abonnements;
- suivi de lecture;
- premiers champs produit pour Le Lit Qui Lit: `content_type`, `language`, `theme`, `audio_url`, `duration_seconds`, `preferred_language`, `interests`.

Le projet actuel doit donc etre transforme progressivement en MVP "Le Lit Qui Lit", pas remplace.

## Etat actuel par rapport au cahier des charges

| Bloc produit | Etat actuel | Decision |
| --- | --- | --- |
| Navigation enfant par pictogrammes | Partiel, deja commence dans `KidsLibrary.jsx`. | Continuer et rendre l'ecran encore plus tactile/non lecteur. |
| Bibliotheque audio | Partiel: champ `audio_url` existe, lecture audio simple cote enfant. | Ajouter upload audio admin et lecteur audio dedie. |
| Profils enfants | Partiel: age, photo, langue, interets existent. | Ajouter preferences plus visibles cote parent/enfant. |
| Controle parental | Partiel: categories, objectifs et suivi lecture. | Ajouter temps d'ecran, horaires, types/langues/themes autorises. |
| Admin contenus | Partiel: livres, pages, metadata. | Adapter a "contenus": histoire audio, comptine, quiz, educatif. |
| Abonnements | Base presente. | Garder pour MVP, renforcer plus tard avec cycle paiement complet. |
| Offline | Manquant. | Ajouter PWA/service worker et selection de contenus telechargeables. |
| Assistant vocal IA | Manquant. | Simuler d'abord le parcours, brancher IA ensuite. |
| Clonage vocal | Manquant et sensible. | Preparer consentement et modele de donnees avant vraie IA voix. |
| Securite enfants/voix | Partiel. | Ajouter consentement, suppression definitive, limites IA. |

## MVP cible realiste

La V1 doit prouver l'experience enfant et le controle parent, sans essayer de livrer toute l'IA finale d'un coup.

### Dans le MVP V1

- Accueil enfant tactile avec pictogrammes.
- Bibliotheque d'histoires audio et visuelles.
- Filtres simples par univers, langue et age.
- Profils enfants avec langue preferee et centres d'interet.
- Espace parent pour autoriser les contenus.
- Espace parent pour regler temps d'utilisation et horaires.
- Espace admin pour ajouter/modifier des contenus.
- Support multilingue FR/AR/EN au niveau metadata.
- Preparation offline pour favoris et histoires telechargeables.
- Simulation UI de l'assistant vocal et de la voix parentale, sans clonage reel.

### Hors MVP V1

- Clonage vocal reel.
- Paiement Stripe complet avec webhooks robustes.
- Assistant vocal IA production.
- Generation automatique d'histoires production.
- Application Android native.
- Recommandation intelligente avancee.

Ces blocs restent prevus, mais viennent apres une base stable.

## Ordre de realisation recommande

### Etape 1 - Stabiliser l'experience enfant

Objectif: faire sentir le produit "lit intelligent" des le premier ecran.

Fichiers principaux:

- `frontend/src/pages/KidsLibrary.jsx`
  - transformer l'ecran en vrai tableau de bord enfant;
  - reduire la dependance a la recherche texte;
  - mettre les univers visuels au centre;
  - rendre l'action "ecouter" prioritaire sur "lire";
  - ajouter un etat clair quand aucune histoire audio n'est disponible.

- `frontend/src/components/Icons.jsx`
  - ajouter les icones manquantes pour micro, lune/nuit, telechargement, cadenas parent, horloge.

- `frontend/src/utils/storage.js`
  - stocker favoris audio;
  - stocker derniers contenus ecoutes;
  - preparer une liste locale `offlineContentIds`.

Critere d'acceptation:

- un enfant peut choisir un univers avec une grande zone tactile;
- il peut lancer une histoire audio en un clic;
- l'ecran reste utilisable sans savoir lire.

### Etape 2 - Ajouter le vrai support audio admin

Objectif: ne plus dependre uniquement d'une URL audio manuelle.

Fichiers principaux:

- `backend/routes/books.js`
  - accepter un champ fichier `audio`;
  - stocker le fichier audio dans `uploads/books` ou Supabase;
  - autoriser les formats audio utiles: mp3, wav, m4a, ogg;
  - renvoyer `audio_url` au frontend.

- `backend/database/init.js`
  - garder `audio_url`;
  - ajouter si besoin `audio_mime_type`, `audio_file_size`, `narration_type`.

- `frontend/src/components/admin/BookManagement.jsx`
  - remplacer ou completer "URL audio" par upload audio;
  - afficher duree, langue, type, univers;
  - montrer clairement si un contenu est "pret a ecouter".

- `frontend/src/api/books.js`
  - verifier que `FormData` transmet bien le fichier audio.

Critere d'acceptation:

- un admin peut ajouter une histoire avec couverture, pages et audio;
- l'enfant peut ecouter cette histoire depuis `/kids`.

### Etape 3 - Renforcer l'espace parent

Objectif: donner au parent le vrai controle attendu dans le cahier des charges.

Fichiers principaux:

- `backend/database/init.js`
  - ajouter `parental_rules`;
  - champs proposes: `kid_profile_id`, `daily_screen_time_minutes`, `quiet_start_time`, `quiet_end_time`, `allowed_languages`, `allowed_content_types`, `allowed_themes`, `updated_at`.

- `backend/routes/parental.js`
  - ajouter endpoints:
    - `GET /parental/kids/:id/rules`;
    - `PUT /parental/kids/:id/rules`.
  - garder les approbations categories existantes.

- `frontend/src/api/parental.js`
  - ajouter `getRules(kidId)`;
  - ajouter `saveRules(kidId, data)`.

- `frontend/src/pages/ParentDashboard.jsx`
  - ajouter une section "Regles du coucher";
  - permettre de regler duree, horaires, langues, themes et types de contenus;
  - afficher un resume clair pour chaque enfant.

Critere d'acceptation:

- un parent peut configurer les regles principales pour un enfant;
- ces regles sont sauvegardees et visibles.

### Etape 4 - Appliquer les regles parentales cote enfant

Objectif: l'enfant ne voit que ce qui est autorise.

Fichiers principaux:

- `backend/routes/books.js`
  - filtrer `/books/published` avec les regles parentales quand l'utilisateur est `kid`;
  - garder le filtre par categories deja existant;
  - ajouter filtres langue/theme/type si les regles existent.

- `frontend/src/pages/KidsLibrary.jsx`
  - afficher les contenus autorises;
  - afficher un message doux si le parent doit autoriser plus de contenus;
  - masquer les controles adultes.

Critere d'acceptation:

- les restrictions parentales sont respectees automatiquement par le backend;
- un enfant ne peut pas contourner les limites depuis l'interface.

### Etape 5 - Preparer le mode hors connexion

Objectif: rendre le produit credible pour un lit/tablette qui peut perdre Internet.

Fichiers principaux:

- `frontend/public/manifest.webmanifest`
  - definir nom, icones, couleur, mode standalone.

- `frontend/public/sw.js`
  - cacher l'application;
  - preparer le cache des couvertures et audios favoris.

- `frontend/src/main.jsx`
  - enregistrer le service worker.

- `frontend/src/utils/storage.js`
  - ajouter helpers pour contenus telechargeables.

- `backend/routes/offline.js`
  - futur endpoint pour le manifeste de contenus autorises.

- `backend/server.js`
  - monter `/api/offline` quand la route existe.

Critere d'acceptation:

- l'application se charge en mode PWA;
- les favoris/preselections peuvent etre identifies pour cache local.

### Etape 6 - Ajouter les messages parentaux simples

Objectif: livrer une premiere valeur emotionnelle avant le clonage vocal.

Fichiers principaux:

- `backend/database/init.js`
  - ajouter `parent_messages`: parent, enfant, titre, texte, audio_url, langue, actif.

- `backend/routes/parental.js` ou nouveau `backend/routes/messages.js`
  - CRUD messages parentaux.

- `frontend/src/pages/ParentDashboard.jsx`
  - ajouter enregistrement ou upload d'un message audio;
  - associer le message a un enfant.

- `frontend/src/pages/KidsLibrary.jsx`
  - afficher un bouton "message de maman/papa" si disponible.

Critere d'acceptation:

- un parent peut ajouter un message;
- l'enfant peut l'ecouter dans son espace.

### Etape 7 - Preparer IA vocale sans la rendre dangereuse

Objectif: ajouter une architecture IA propre avec garde-fous.

Fichiers principaux:

- `backend/routes/ai.js`
  - endpoint conversation;
  - endpoint generation histoire;
  - endpoint recommandations simples.

- `backend/services/ai/`
  - `provider.js`: abstraction fournisseur IA;
  - `safety.js`: limites age, moderation, refus doux;
  - `prompts.js`: prompts par age/langue.

- `backend/database/init.js`
  - ajouter `ai_interactions` avec retention limitee.

- `frontend/src/pages/KidsLibrary.jsx` ou `frontend/src/components/VoiceAssistant.jsx`
  - bouton micro;
  - etat ecoute/reponse;
  - fallback texte/audio.

Critere d'acceptation:

- le parcours assistant est visible;
- le backend a un endroit unique pour brancher un fournisseur IA;
- aucune donnee sensible enfant n'est envoyee sans regle claire.

### Etape 8 - Preparer clonage vocal avec consentement

Objectif: construire les garde-fous avant la fonction differenciante.

Fichiers principaux:

- `backend/database/init.js`
  - ajouter `voice_consents`;
  - ajouter `voice_profiles`;
  - ajouter statut: `pending`, `recording`, `processing`, `ready`, `revoked`, `deleted`.

- `backend/routes/voices.js`
  - consentement;
  - upload/enregistrement voix;
  - liste des voix disponibles;
  - suppression definitive.

- `frontend/src/pages/ParentDashboard.jsx`
  - parcours consentement;
  - enregistrement voix;
  - gestion des voix familiales.

- `frontend/src/pages/KidsLibrary.jsx`
  - selection de voix seulement si autorisee.

Critere d'acceptation:

- aucun clonage ne peut etre lance sans consentement explicite;
- une voix peut etre supprimee definitivement;
- l'interface explique clairement que c'est une fonction parentale.

## Premier lot de developpement conseille

Le prochain lot a coder doit rester petit et visible:

1. Ajouter upload audio admin.
2. Ajouter lecteur audio enfant plus clair.
3. Ajouter regles parentales de base: duree quotidienne, horaires, langues, themes.
4. Appliquer ces regles dans `/books/published`.

Ce lot transforme directement le POC lecture en MVP "ecoute du coucher".

## Definition de "termine" pour le lot 1

- Le backend demarre.
- Le frontend build.
- Un admin peut creer un contenu audio.
- Un parent peut definir les preferences/regles d'un enfant.
- Un enfant voit une interface simple par univers.
- Un enfant peut ecouter une histoire autorisee.
- Les contenus non autorises ne sont pas visibles pour l'enfant.
- La documentation est mise a jour.

## Commandes de verification

Depuis le repo:

```powershell
npm.cmd run dev:backend
npm.cmd run dev:frontend
```

Verification rapide backend:

```powershell
cd backend
node --check server.js
node --check routes/books.js
node --check routes/parental.js
node --check database/init.js
```

Verification rapide frontend:

```powershell
cd frontend
npm.cmd run build
```

## Notes produit importantes

- Le clonage vocal est un avantage fort, mais il ne doit pas etre le premier bloc technique.
- L'audio, les profils enfants et les regles parentales doivent venir avant l'IA.
- Les roles existants `admin`, `parent`, `kid` restent le contrat principal.
- Les donnees enfants et les donnees vocales doivent etre traitees comme sensibles des maintenant.
- La V1 doit surtout convaincre par l'experience enfant et la confiance parentale.
