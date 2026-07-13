# Le Lit Qui Lit - Analyse du cahier des charges

> **Note (2026-07-13)** : Ce document date de juillet 2026 et décrit l'état **avant** les phases 1–7. Pour l'audit actuel, voir [`CAHIER_DES_CHARGES_AUDIT.md`](./CAHIER_DES_CHARGES_AUDIT.md) et [`PRODUCTION_LAUNCH.md`](./PRODUCTION_LAUNCH.md).

Version: 1.0  
Date: 2026-07-01  
Projet: H-Kids / HKids

## Resume executif

Le cahier des charges decrit un produit plus large que le POC actuel. Le repo HKids contient deja une base solide pour une plateforme de lecture: comptes admin, parent et enfant, bibliotheque de livres, categories, upload de contenu, abonnements, controle parental par categories, profils enfants et suivi de lecture.

Le MVP demande maintenant de transformer cette base en application "Le Lit Qui Lit": une experience tactile et vocale pour enfants de 2 a 10 ans, utilisable sans savoir lire, compatible Android embarque, avec audio, IA vocale, clonage vocal parental, mode hors connexion, contenus multilingues et garanties fortes sur les donnees enfants.

Conclusion: le projet n'est pas a reprendre de zero. Il faut le repositionner en modules produit autour de 5 axes: experience enfant non lectrice, audio/IA, controle parental avance, contenu multilingue/offline, securite et consentement.

## Ce qui existe deja dans le repo

| Domaine | Etat actuel |
| --- | --- |
| Authentification | JWT avec roles `admin`, `parent`, `kid`. |
| Profils enfants | `kids_profiles` avec nom, avatar et age. |
| Bibliotheque | Livres publies, pages/images/PDF, categories, couvertures. |
| Admin | Gestion de livres et categories. |
| Parent | Creation de profils, creation de comptes enfants, approbation de categories. |
| Enfant | Bibliotheque filtree par categories autorisees. |
| Abonnements | Plans, essai, activation manuelle, checkout Stripe optionnel. |
| Suivi | Progression, sessions, objectifs et badges de lecture. |
| Stockage | Upload local ou Supabase Storage selon configuration. |
| Internationalisation | Base frontend existante avec `LanguageContext` et traductions. |

## Ecarts principaux avec le cahier des charges

| Besoin du cahier des charges | Etat actuel | Priorite |
| --- | --- | --- |
| Navigation sans lecture par pictogrammes, couleurs, mascotte, animations | Partiel. Interface enfant encore textuelle avec recherche et cartes livres. | P0 |
| Bibliotheque audio | Manquant. Le modele `books` ne gere pas encore les pistes audio/narration. | P0 |
| Assistant vocal IA | Manquant. Aucun endpoint voix, conversation ou TTS/STT. | P0 |
| Clonage vocal parental | Manquant. Aucune collecte de consentement, voix, modele vocal ou lecture avec voix clonnee. | P0 |
| Profils enfants complets | Partiel. Il manque photo, langue preferee, centres d'interet, niveau/developpement. | P0 |
| Controle parental temps d'ecran et horaires | Manquant. Le controle actuel couvre surtout les categories. | P0 |
| Contenus multilingues arabe/francais/anglais | Partiel. UI multilingue partielle, contenu non modelise par langue. | P0 |
| Utilisation hors connexion | Manquant. Pas de service worker, cache manifeste ou telechargement controle. | P0 |
| Gestion des abonnements | Partiel. Base presente, paiement Stripe optionnel, besoin de durcir le cycle de vie. | P1 |
| Tableau admin global | Partiel. Gestion contenu presente, mais pas encore utilisateurs, moderation, support, stats. | P1 |
| Recommandations intelligentes | Manquant. Il existe du suivi, mais pas de moteur de recommandation. | P1 |
| Protection des donnees enfants | Partiel. Auth et roles existent, mais consentement, suppression definitive, audit et politique donnees voix manquent. | P0 |
| Android embarque / lit tactile | Partiel. Web responsive, mais pas encore mode kiosk/PWA/offline cible device. | P1 |

## MVP recommande

### Sprint 1 - Cadrage technique et experience enfant

Objectif: rendre l'application credible pour le produit "lit intelligent" sans encore tout connecter a l'IA.

- Ajouter un vrai mode enfant non lecteur: grille de themes par pictogrammes, grosses zones tactiles, peu ou pas de texte.
- Ajouter au modele contenu les champs `language`, `content_type`, `theme`, `audio_url`, `duration_seconds`.
- Ajouter les champs enfant: `preferred_language`, `interests`, `photo_url`.
- Preparer la navigation enfant autour des themes du cahier des charges: dinosaures, espace, animaux, princesses, metiers, monde.
- Ajouter une page "ecouter" distincte du lecteur livre actuel.

### Sprint 2 - Audio, offline et parental avance

Objectif: couvrir les fonctions essentielles du coucher.

- Gerer upload/lecture de fichiers audio depuis l'admin.
- Ajouter favoris hors connexion avec cache PWA/service worker.
- Ajouter parametres parentaux: duree maximale, plages horaires, contenus autorises par type/langue/theme.
- Ajouter historique parent plus lisible: temps d'ecoute, histoires ecoutees, favoris.
- Ajouter gestion des messages parentaux pre-enregistres.

### Sprint 3 - IA vocale et securite

Objectif: integrer l'IA avec garde-fous enfants.

- Definir un service `ai` separe: conversation, generation d'histoire, moderation, logs minimums.
- Ajouter assistant vocal: speech-to-text, generation reponse adaptee a l'age, text-to-speech.
- Ajouter generation d'histoires personnalisees a partir age, langue et interets.
- Ajouter consentement explicite pour toute voix parentale.
- Ajouter suppression definitive des donnees enfant/voix.

### Sprint 4 - Clonage vocal et admin produit

Objectif: integrer la fonctionnalite differenciante et administrer le systeme.

- Ajouter flux d'enregistrement voix parent/proche.
- Ajouter statut du consentement et statut du modele vocal.
- Ajouter lecture d'histoires avec voix selectionnee.
- Ajouter dashboard admin: utilisateurs, abonnements, stats, moderation, support.
- Ajouter monitoring erreurs, audit securite et documentation exploitation.

## Architecture cible proposee

### Backend

- `routes/ai.js`: assistant vocal, generation d'histoires, recommandations.
- `routes/audio.js`: upload, lecture, metadata audio.
- `routes/voices.js`: consentement, enregistrements, voix disponibles, suppression.
- `routes/offline.js`: manifeste des contenus telechargeables.
- `routes/admin.js`: supervision utilisateurs, stats, moderation.

### Base de donnees

Tables a ajouter progressivement:

- `content_items`: unifier histoires, audio, quiz, jeux, messages.
- `content_localizations`: titre/description/langue par contenu.
- `audio_assets`: fichiers audio, duree, narrateur, langue.
- `child_preferences`: langue, interets, niveau, themes favoris.
- `parental_rules`: temps d'ecran, horaires, langues/types autorises.
- `voice_consents`: consentement explicite et horodatage.
- `voice_profiles`: voix parent/proche, statut, fournisseur, suppression.
- `offline_downloads`: contenus autorises pour cache local.
- `ai_interactions`: historique minimal, securise et limite, pour moderation/recommandation.

### Frontend

- `KidsHome`: entree enfant par pictogrammes.
- `ThemePicker`: choix visuel des univers.
- `AudioPlayer`: lecteur audio simplifie.
- `VoiceAssistant`: bouton micro et reponse vocale.
- `ParentControls`: temps d'ecran, horaires, langue, contenus.
- `VoiceConsentFlow`: consentement et enregistrement voix.
- `OfflineLibrary`: contenus telecharges et favoris disponibles hors ligne.

## Risques a traiter tot

| Risque | Pourquoi c'est important | Action recommandee |
| --- | --- | --- |
| Donnees enfants | Sujet sensible legalement et commercialement. | Minimiser les donnees, documenter retention/suppression, journaliser les consentements. |
| Clonage vocal | Fonction tres sensible, risque d'abus. | Consentement explicite, suppression, limitation des usages, fournisseur fiable. |
| IA pour enfants | Reponses inadaptees possibles. | Moderation, prompts par age, categories interdites, fallback parent/admin. |
| Offline | Necessaire pour usage embarque. | PWA/service worker, manifeste contenu, strategie cache et mise a jour. |
| Android embarque | Contraintes ecran/tactile/performance. | Tester en mode kiosk, gros boutons, audio autoplay restrictions, stockage local. |
| Abonnements | Paiement et droits d'acces doivent etre fiables. | Webhooks Stripe, statuts, renouvellement, annulation, essais. |

## Questions a poser demain

1. Le lit aura-t-il une tablette Android standard, une WebView, ou une application native?
2. L'assistant vocal doit-il fonctionner offline ou seulement avec Internet?
3. Le clonage vocal est-il obligatoire dans le premier MVP livrable, ou peut-il etre une beta fermee?
4. Quel fournisseur IA/voix est envisage: OpenAI, ElevenLabs, Azure, autre?
5. Les contenus audio seront-ils produits par H-Kids, generes par IA, ou importes par les admins?
6. Quels pays/langues sont prioritaires pour les contraintes legales et les paiements?
7. Le contenu religieux doit-il avoir validation humaine avant publication?
8. Les parents doivent-ils pouvoir ajouter leurs propres histoires/messages, ou seulement enregistrer la voix?
9. Quels indicateurs admin sont prioritaires: usage, revenus, contenu, support, moderation?
10. Quel est le delai vise pour le MVP et pour une demo investisseur/client?

## Plan d'action immediat

1. Renommer mentalement le repo actuel comme "base POC lecture" et non produit complet.
2. Valider avec l'equipe que les roles existants `admin`, `parent`, `kid` restent le contrat principal.
3. Commencer par l'experience enfant pictogrammes + audio, car c'est le coeur visible du cahier des charges.
4. Modeliser l'audio et les langues avant l'IA, sinon l'assistant vocal sera difficile a brancher proprement.
5. Decider rapidement le fournisseur IA/voix pour eviter de coder une abstraction trop vague.
6. Mettre la securite enfant et le consentement vocal dans le MVP technique, pas comme option de fin.
