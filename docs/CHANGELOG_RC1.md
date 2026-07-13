# HKids — CHANGELOG RC1

**Version :** `v1.0.0-rc1`  
**Date :** 13 juillet 2026  
**Commit tagué :** `049f1cb`  
**Branche :** `main`

Release Candidate 1 — première version stable destinée à une **démonstration partenaire** (10–15 minutes). Cette RC couvre les parcours enfant, parent et administrateur avec données de démo, tests automatisés verts et correctifs QA P0/P1.

---

## Fonctionnalités incluses

### Parcours enfant
- Accueil enfant (`/kids`) : mascotte « Le Lit », grille thématique pictogrammes, recommandations, messages vocaux familiaux
- Navigation bottom nav : accueil, bibliothèque, jeux, studio IA, histoires IA, médailles
- Bibliothèque (`/kids/library`) : sélection livre → lecture `/kids/read/:id`
- Lecteur (`BookReader`) : pages, audio intégré / TTS, favoris, progression automatique, préférences lecture parent
- Audio (`/kids/audio`) : comptines et contenus audio
- Learning (`/kids/learning`) : quiz et jeux (mémoire, QCM) avec scoring et sauvegarde des tentatives
- Studio histoires IA (`/kids/story-studio`) et galerie (`/kids/ai-stories`)
- Assistant vocal : navigation par mots-clés + mode démonstration conversationnel sans clé OpenAI
- Catégories thématiques (`/kids/category/:id`)
- Synchronisation cloud : favoris, progression, historique, téléchargements offline

### Espace parent
- Inscription / connexion, création profils enfants et comptes enfant
- Dashboard (`/parent`) : analytics, objectifs lecture, temps d'écran, activité
- Règles parentales : horaires, limites, types de contenu autorisés
- Approbations catégories livres (`ParentCategoryApprovals`)
- Messages vocaux pour l'enfant (`/parent/voices`)
- Clonage vocal ElevenLabs (consentement, upload sécurisé, suppression)
- Centre confidentialité RGPD (export, suppression, journal)
- Tickets support (création depuis les paramètres)
- Hub navigation : profils, voix, abonnements

### Administration
- Panneau admin complet (`/admin/*`) : overview, CMS livres, catégories, quiz & jeux, utilisateurs
- Modération, signalements, support tickets, abonnements gérés
- Statistiques, journal d'audit, permissions granulaires

### Plateforme & technique
- Auth JWT multi-rôles (parent / enfant / admin)
- API REST sous `/api/` avec rate limiting, headers sécurité, validation uploads
- PWA offline : service worker, `offline.html`, manifest téléchargements
- Abonnements Stripe (checkout, webhooks, factures, essai)
- Intégrations IA : OpenAI (histoires, recommandations, assistant) avec fallbacks démo
- Intégrations voix : ElevenLabs TTS / STT / clonage
- i18n FR / EN / AR (parcours enfant et parent ; admin en français)
- CI GitHub Actions : lint, typecheck, tests backend/frontend, build, E2E Playwright
- Build Android Capacitor (préparation release)
- Données de démo seedées : 4 catégories, 5 livres publiés, 6 contenus learning

---

## Bugs corrigés (QA + RC1)

### P0 — Bloquants (rapport QA 13/07/2026)
| Bug | Correction |
|-----|------------|
| Support HTTP 500 à la création de ticket | `logSecurityEvent(pool, …)` corrigé dans `supportTicketService.js` |
| Quiz/jeux invisibles pour l'enfant | Filtre parental découplé learning / catégories livres ; flag `source: 'learning'` |
| Catalogue lecture/audio vide | Seed idempotent livres + catégories dans `database/init.js` |

### P1 — Majeurs
| Bug | Correction |
|-----|------------|
| Assistant IA HTTP 503 sans clé | Mode démo (`demo_mode: true`, provider `demo`) |
| Préférences lecture ignorées | `reading_wide_spacing` / `reading_auto_audio` branchés dans `BookReader` |
| Toggles notifications factices | Retirés de `SettingsCenterModal` |
| E2E authentifiés sans backend en CI | Playwright démarre backend + frontend ; Postgres en CI |

### Post-QA
| Bug | Correction |
|-----|------------|
| Jeu mémoire « Réponse impossible à enregistrer » | `scoreGameAttempt()` + alignement règles parentales quiz/game |

### RC1 (commit `049f1cb`)
| Bug | Correction |
|-----|------------|
| Cloud sync HTTP 500 (`integer = text`) | Casts `$1::integer` cohérents dans `computeSyncToken` — sessions enfant sans erreur sur `/api/parental/me/cloud-sync` |

---

## Tests validés pour cette RC

| Suite | Résultat |
|-------|----------|
| Backend (`npm run test:backend`) | **77/77** |
| Frontend Vitest | **25/25** |
| Playwright E2E | **21/21** |
| Build production (`npm run build`) | ✅ |

---

## Limitations connues (non bloquantes pour la démo)

| Limitation | Impact |
|------------|--------|
| Pas de clé `OPENAI_API_KEY` | Assistant conversationnel et histoires IA en **mode démo** (réponses template) |
| Pas de clé `ELEVENLABS_API_KEY` | UI clonage vocal visible ; création profil voix impossible sans clé |
| Pas de clé Stripe live/test | Page abonnements et UI checkout visibles ; paiement réel non testable |
| `/kids/audio` absent de la bottom nav | Accessible via raccourci 🎧 sur l'accueil enfant |
| Signalement contenu | API `POST /api/reports` sans UI parent/enfant dédiée |
| Notifications push/email | Non implémentées (retirées de l'UI pour éviter fausse promesse) |
| Admin i18n | Interface admin en français uniquement |
| Android device | Build Capacitor préparé ; validation matérielle non incluse dans RC1 |
| Mascotte / UX non-lecteur | Présente mais expérience encore partielle sur `BookReader` |
| Production publique | Monitoring (Sentry), charge, clés live et volume contenu non validés |

---

## Prérequis de démonstration

### Environnement
```bash
npm run install:all
# Configurer .env backend : DATABASE_URL, JWT_SECRET (≥ 32 caractères)
npm run dev:backend   # port 3000
npm run dev:frontend  # port 5173
```

Ou déployer `main` @ `v1.0.0-rc1` sur staging (Vercel + Postgres) et vérifier que le seed s'exécute au premier démarrage.

### Comptes recommandés
| Rôle | Accès |
|------|-------|
| Admin | `/admin/login` — compte seed `admin` (changer le mot de passe en prod) |
| Parent | Créer via `/parent/signup` ou compte démo préparé |
| Enfant | Créer depuis dashboard parent → « Créer un compte enfant » |

### Variables optionnelles (démo « live »)
| Variable | Effet si présente |
|----------|-------------------|
| `OPENAI_API_KEY` | Histoires IA et assistant conversationnel réels |
| `ELEVENLABS_API_KEY` | Clonage vocal et TTS ElevenLabs |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Checkout et webhooks abonnements |

### Préparation avant la salle (5 min)
1. Vérifier `books_published ≥ 5` et `learning_published ≥ 6` (`node backend/scripts/qa-db-check.js`)
2. Ouvrir un livre une fois (progression + cache)
3. Autoriser le micro navigateur (assistant vocal)
4. Optionnel : pré-télécharger un livre pour segment offline
5. Chronométrer la checklist démo 10–15 min (parcours enfant → parent → admin)

### Commandes de validation rapide
```bash
npm run lint && npm run typecheck && npm run test && npm run test:e2e
git describe --tags   # doit afficher v1.0.0-rc1
```

---

## Verdict RC1

**Prête pour démonstration partenaire** sur environnement à jour (`v1.0.0-rc1`), avec mode démo IA acceptable si clés API absentes.

**Non prête pour production publique** — voir limitations ci-dessus et checklist `docs/PRODUCTION_READINESS.md`.

---

## Références

- Rapport production : `docs/PRODUCTION_READINESS.md`
- Audit cahier des charges : `docs/CAHIER_DES_CHARGES_AUDIT.md`
- Tests QA reproductibles : `backend/tests/qa/role-journeys.test.js`, `e2e/qa-ui.spec.js`
