# Audit cahier des charges — Le Lit Qui Lit

Version: 2.0  
Date: 2026-07-10  
Projet: HKids / H-Kids  
Branche de référence: `main` (post production-readiness `d9b8615`)

## Résumé exécutif

Le repo HKids couvre **environ 85 %** du cahier des charges « Le Lit Qui Lit » (juillet 2026, post phases 1–7). La base technique est solide (auth, contenu, admin, IA, offline, Android, GDPR, CI). Les écarts restants sont surtout **produit** : expérience non-lecteur, mascotte, UI parentale complète, recommandations IA réelles, kiosk matériel Android, et volume de contenu audio multilingue en production.

**Aucun domaine n'est à 100 %** selon le cahier des charges complet. **15 domaines** sont partiels ou avancés.

---

## Tableau spec → fichiers → % → écarts

| # | Domaine (cahier des charges) | Fichiers clés | % | Écarts principaux |
|---|------------------------------|---------------|---|-------------------|
| 1 | **UX enfant non-lecteur** (pictogrammes, couleurs, mascotte, peu de texte) | `frontend/src/pages/KidsHome.jsx`, `KidsLibrary.jsx`, `constants/kidCategories.js`, `components/kids/KidCategoryCard.jsx`, `components/kids/LitMascot.jsx` | **68→75** | Grille pictogrammes OK. Mascotte ajoutée (P0). Barre recherche retirée côté enfant. Titres livres encore visibles sur certaines cartes. |
| 2 | **Bibliothèque audio** | `frontend/src/pages/BookReader.jsx`, `hooks/useAudioPlayer.js`, `components/audio/AudioPlayer.jsx`, `backend/routes/books.js` | **82** | Lecteur audio + `audio_url` + voix familiale. Dépend du remplissage catalogue ; UI lecteur encore dense pour 2–4 ans. |
| 3 | **Assistant vocal IA** | `frontend/src/components/kids/VoiceAssistant.jsx`, `backend/routes/ai.js`, `services/ai/voiceAssistantService.js` | **85** | STT → LLM → TTS navigateur. Garde-fous parentaux. Pas de TTS serveur natif ; nécessite clés IA + micro. |
| 4 | **Clonage vocal parental** | `frontend/src/pages/FamilyVoices.jsx`, `backend/routes/voices.js`, `services/ai/VoiceCloneService.js` | **88** | Consentement, enregistrement, narration, suppression GDPR. Requiert `ELEVENLABS_API_KEY`. |
| 5 | **Profils enfants complets** | `frontend/src/components/parent/KidProfileFormModal.jsx`, `backend/routes/parental.js`, table `kids_profiles` | **78** | Nom, âge, avatar, intérêts, langue, photo. Photo en base64 côté client — pas d'upload dédié robuste. |
| 6 | **Contrôle parental avancé** | `backend/routes/parental.js`, `middleware/parentalAccess.js`, `KidScreenTimeTracker.jsx`, `ParentDashboard.jsx`, `ParentCategoryApprovals.jsx` | **85** | Temps d'écran, horaires, langues/thèmes. **UI approbations catégories** branchée (Phase 3). |
| 7 | **Multilingue ar/fr/en** | `context/LanguageContext.jsx`, `utils/translations.js`, champ `books.language` | **75** | Parcours enfant trilingue. Parent/admin/studio souvent en français fixe. Pas de `content_localizations` par item. |
| 8 | **Hors connexion / PWA** | `public/sw.js`, `services/offline/offlineContentService.js`, `hooks/useOfflineContent.js` | **80** | SW + IndexedDB + téléchargements. Pas d'auth offline complète ni sync universelle. |
| 9 | **Abonnements** | `backend/routes/subscriptions.js`, `routes/stripeWebhooks.js`, `pages/Subscriptions.jsx` | **85** | Stripe checkout, webhooks, gating premium. Production = clés Stripe + webhooks configurés. |
| 10 | **Tableau admin global** | `pages/AdminDashboard.jsx`, `components/admin/*`, `backend/routes/admin.js` | **90** | Livres, modération, users, abonnements, audit. Quelques libellés FR uniquement. |
| 11 | **Recommandations intelligentes** | `backend/services/ai/RecommendationService.js`, `routes/recommendations.js`, `KidsHome.jsx` | **72→80** | Scoring déterministe + **tentative IA LLM** (P0) avec repli rule-based. Pas de modèle ML dédié. |
| 12 | **Protection données enfants / GDPR** | `components/parent/PrivacyCenter.jsx`, `services/privacy/privacyService.js`, `tests/privacy.test.js` | **85** | Export, suppression, audit, consentement voix. Bannière cookies non visible dans le code. |
| 13 | **Android embarqué / kiosk** | `frontend/android/`, `capacitorRuntime.js`, `docs/ANDROID_CAPACITOR.md` | **65** | Capacitor, immersif, idle reset. Pas de Lock Task / device owner. JDK 17/21 requis pour build. |
| 14 | **Catalogue contenu** | `BookManagement.jsx`, `kidCategories.js`, schéma `books` (`theme`, `audio_url`, `language`) | **85** | Modèle riche en admin. Couverture audio/thèmes = données réelles à produire. |
| 15 | **Génération d'histoires IA** | `KidsStoryStudio.jsx`, `KidsAIStories.jsx`, `storyGenerationService.js` | **80** | Wizard pictogrammes → LLM → TTS. Texte seul, pas d'illustrations page par page. |

---

## Matrice MVP cahier des charges

| Exigence | Statut | Preuve / fichier |
|----------|--------|------------------|
| Navigation pictogrammes (thèmes) | ✅ | `kidCategories.js`, `KidsHome` grille |
| Mascotte animée « Le Lit » | ✅ (P0) | `components/kids/LitMascot.jsx` |
| Zéro lecture obligatoire | ⚠️ | Recherche retirée ; titres couverture partiels |
| Audio par histoire | ⚠️ | Champ + lecteur ; contenu à remplir |
| Assistant vocal | ✅ | `VoiceAssistant.jsx` + `routes/ai.js` |
| Clonage voix parent | ✅ | `FamilyVoices.jsx` + ElevenLabs |
| Profil enfant riche | ⚠️ | Champs DB + formulaire ; photo fragile |
| Temps d'écran / horaires | ✅ | `parental.js` + tracker |
| Approbation catégories parent | ✅ | `ParentCategoryApprovals.jsx` |
| FR / EN / AR UI enfant | ✅ | `translations.js` |
| Contenu par langue | ⚠️ | Filtre `language` ; pas de localisations multiples |
| Offline favoris / téléchargements | ✅ | `offlineContentService.js` |
| Stripe abonnements | ✅ | Webhooks + tests |
| Admin supervision | ✅ | `AdminDashboard` |
| Reco personnalisée | ⚠️→✅ | IA + fallback rule-based (P0) |
| Export / suppression GDPR | ✅ | `PrivacyCenter` |
| App Android tablette lit | ⚠️ | Capacitor ; kiosk logiciel seulement |
| CI / tests / lint | ✅ | `.github/workflows/ci.yml`, 34+ tests |

Légende : ✅ livré · ⚠️ partiel · ❌ manquant

---

## Dépendances externes (production)

| Variable | Usage |
|----------|--------|
| `OPENAI_API_KEY` (ou Gemini/Anthropic) | Assistant, histoires, recommandations IA |
| `ELEVENLABS_API_KEY` | Clonage vocal |
| `STRIPE_SECRET_KEY` + webhook | Abonnements |
| `VITE_API_URL` | Frontend → API |
| JDK 17 ou 21 | Build Android release |

---

## P0 traités dans cette itération

1. **Mascotte** — composant `LitMascot` sur `KidsHome`
2. **UX non-lecteur** — suppression recherche texte `KidsLibrary`, navigation pictogrammes renforcée, titres optionnels sur cartes
3. **Reco IA** — `RecommendationService.recommendContent()` tente le classement LLM puis repli scoring déterministe

## P0 restants (prochaine vague)

1. Réduire texte sur `BookReader` et cartes « Pour toi » (`KidsHome`)
2. Kiosk Android Lock Task / mode device owner
3. Catalogue audio multilingue en volume (données + admin)
4. UI signalement contenu côté parent
5. Bannière consentement cookies (si analytics)

---

## Références

- Analyse initiale (juillet 2026, partiellement obsolète) : `docs/LE_LIT_QUI_LIT_GAP_ANALYSIS.md`
- Production : `docs/PRODUCTION_READINESS.md`, `docs/PRODUCTION_LAUNCH.md`
- Android : `docs/ANDROID_CAPACITOR.md`, `docs/ANDROID_RELEASE_REPORT.md`
- Confidentialité : `docs/PRIVACY_SECURITY.md`
