# Justification du stack technique - HKids

## Objectif

HKids est une plateforme de lecture numerique pour enfants. Le stack doit donc etre:

- simple a maintenir pour une equipe etudiante;
- compatible avec navigateur, tablette et appareil dedie;
- assez leger pour des appareils moyens;
- securisable pour proteger les roles admin, parent et enfant;
- extensible pour l'audio, le suivi parental et les futures statistiques.

## Frontend

### React 18

React permet de construire une interface riche avec des composants reutilisables: lecteur de livre, dashboard parent, back-office admin, formulaires et panneaux de personnalisation.

Justification:

- ecosysteme tres large;
- facilite de maintenance grace aux composants;
- compatible avec PWA ou packaging tablette;
- bonne integration avec les APIs navigateur comme `speechSynthesis` pour la narration.

### Vite

Vite est utilise pour le developpement rapide et le build frontend.

Justification:

- demarrage tres rapide en local;
- build optimise pour production;
- configuration simple;
- adapte a un POC et a un deploiement Vercel.

### Tailwind CSS

Tailwind permet de construire rapidement une interface coherente sans multiplier les fichiers CSS.

Justification:

- productivite elevee;
- design responsive;
- facilite d'adaptation tablette/mobile;
- coherent pour les interfaces enfant, admin et parent.

### Framer Motion

Framer Motion sert aux animations du lecteur: transitions, page turning, feedback visuel.

Justification:

- ameliore l'immersion;
- animations declaratives faciles a maintenir;
- bonne compatibilite React.

## Backend

### Node.js + Express

Express fournit une API REST simple pour les livres, categories, authentification, parental control, abonnements et newsletter.

Justification:

- meme langage que le frontend;
- architecture REST claire;
- nombreux middlewares disponibles;
- facile a deployer sur Render, Fly.io, Vercel serverless ou serveur classique.

### JWT

JWT est utilise pour authentifier les utilisateurs et transporter le role (`admin`, `parent`, `kid`).

Justification:

- stateless;
- compatible web/tablette;
- facilite la protection des routes;
- extensible pour de futurs roles.

### bcryptjs

Les mots de passe sont hashes avec bcrypt.

Justification:

- standard reconnu;
- evite le stockage en clair;
- simple a utiliser dans Node.js.

## Base de donnees

### PostgreSQL

PostgreSQL stocke les utilisateurs, livres, pages, categories, profils enfants, approbations parentales, sessions, objectifs et progression.

Justification:

- fiable et robuste;
- relations claires entre parents, enfants, livres et categories;
- support des transactions;
- scalable via Supabase, Render, Neon ou autre provider manage;
- meilleur choix qu'une base fichier pour un projet avec plusieurs utilisateurs.

## Stockage fichiers

### Supabase Storage ou stockage local

Le projet supporte le stockage local en developpement et Supabase Storage en production.

Justification:

- local: simple pour tester;
- Supabase: compatible production/serverless;
- evite de perdre les fichiers uploades lors des redeploiements;
- pratique pour les PDF, images de couverture et pages.

## Portabilite materielle

HKids reste hardware-agnostic car l'experience principale fonctionne dans un navigateur moderne.

Compatibilites:

- ordinateur;
- tablette;
- navigateur embarque sur appareil dedie;
- future PWA/kiosk mode.

## Scalabilite

Le stack peut evoluer sans refaire l'application:

- frontend statique distribue via CDN;
- backend API deployable separement;
- PostgreSQL manage;
- Supabase Storage ou autre cloud storage;
- ajout futur de cache/CDN si necessaire.

## Securite

Choix importants:

- JWT pour authentification;
- roles `admin`, `parent`, `kid`;
- bcrypt pour mots de passe;
- validation cote API;
- contenu enfant limite aux livres publies et categories approuvees.

## Conclusion

Le stack React + Vite + Express + PostgreSQL est coherent pour HKids: rapide pour un POC, maintenable pour une equipe etudiante, compatible tablette/appareil dedie, et assez robuste pour une evolution vers une version production.
