# AI Abstraction Architecture

## Objectif

Le backend expose une couche IA unique sous `backend/services/ai`. Les routes et les futures fonctionnalites applicatives ne doivent pas appeler directement OpenAI, Gemini, Claude ou un autre fournisseur. Elles doivent passer par un service metier, qui utilise uniquement l'interface commune `AIProvider`.

## Structure

```text
backend/services/ai/
  AIProvider.js
  AIProviderFactory.js
  aiConfig.js
  errors.js
  index.js
  StoryGenerationService.js
  voiceAssistantService.js
  RecommendationService.js
  VoiceCloneService.js
  TranslationService.js
  providers/
    MockAIProvider.js
    OpenAIProvider.js
    GeminiProvider.js
    ClaudeProvider.js
    mockStoryGenerationProvider.js
    mockVoiceAssistantProvider.js
```

## Role des composants

- `AIProvider.js`: interface runtime commune. Elle definit `generateStory`, `chat`, `recommendContent`, `cloneVoice` et `translate`.
- `AIProviderFactory.js`: choisit le fournisseur actif avec `AI_PROVIDER`.
- `aiConfig.js`: centralise la configuration IA et les cles API cote backend.
- `errors.js`: normalise les erreurs IA: timeout, fournisseur indisponible, quota, reseau, methode non implementee.
- `MockAIProvider.js`: fournisseur local de developpement qui reutilise les providers mock existants.
- `OpenAIProvider.js`, `GeminiProvider.js`, `ClaudeProvider.js`: adaptateurs prepares, sans logique metier complete pour le moment.
- `StoryGenerationService.js`: orchestre uniquement la generation d'histoires personnalisees.
- `voiceAssistantService.js`: orchestre uniquement les conversations de l'assistant vocal.
- `RecommendationService.js`: point d'entree futur pour les recommandations personnalisees.
- `VoiceCloneService.js`: point d'entree futur pour le clonage vocal.
- `TranslationService.js`: point d'entree futur pour la traduction de contenus.

## Exemple: generation d'histoires

La route `POST /api/generated-stories/generate` continue d'appeler:

```js
generatePersonalizedStory({ kid, preferences })
```

`StoryGenerationService` normalise le profil enfant et les preferences, puis appelle:

```js
this.aiProvider.generateStory({ kid: safeKid, preferences })
```

Le service ne connait pas OpenAI, Gemini ou Claude. Le fournisseur actif est choisi par:

```env
AI_PROVIDER=mock
```

Pour passer a un vrai fournisseur, il faudra implementer l'adaptateur concerne, par exemple `OpenAIProvider.generateStory`, puis configurer:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

Les routes et le frontend ne changent pas.

## Ajouter un nouveau fournisseur

1. Creer `backend/services/ai/providers/NewProvider.js`.
2. Etendre `AIProvider`.
3. Implementer seulement les methodes necessaires.
4. Ajouter le fournisseur dans `AIProviderFactory.js`.
5. Ajouter les variables de configuration dans `aiConfig.js` et `backend/env.example`.

Le reste de l'application continue d'utiliser les services IA existants.

## Points a completer

- Implementer les appels reels dans `OpenAIProvider`, `GeminiProvider` ou `ClaudeProvider`.
- Ajouter une selection de modele par usage si necessaire.
- Ajouter logs/audit IA par requete.
- Ajouter tests unitaires pour la factory, les services et la normalisation d'erreurs.
- Ajouter les endpoints applicatifs pour recommandations, traduction et clonage vocal quand ces phases demarrent.
