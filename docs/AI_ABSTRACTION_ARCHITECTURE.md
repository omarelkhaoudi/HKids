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
  TranslationService.js
  aiLogger.js
  providerUtils.js
  providers/
    OpenAIProvider.js
    GeminiProvider.js
    AnthropicProvider.js
```

## Role des composants

- `AIProvider.js`: interface runtime commune. Elle definit les contrats, le timeout, les retries exponentiels et les logs structures.
- `AIProviderFactory.js`: choisit le fournisseur actif avec `AI_PROVIDER`.
- `aiConfig.js`: centralise la configuration IA et les cles API cote backend.
- `errors.js`: normalise les erreurs IA: timeout, fournisseur indisponible, quota, reseau, methode non implementee.
- `OpenAIProvider.js`, `GeminiProvider.js`, `AnthropicProvider.js`: adaptateurs reels selectionnes uniquement par configuration.
- `aiLogger.js`: journalisation structuree sans prompts, cles ou donnees enfant.
- `providerUtils.js`: prompts de securite, parsing JSON et parsing SSE.
- `StoryGenerationService.js`: orchestre uniquement la generation d'histoires personnalisees.
- `voiceAssistantService.js`: orchestre uniquement les conversations de l'assistant vocal.
- `RecommendationService.js`: recommandations deterministes et point d'entree provider optionnel.
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
AI_PROVIDER=openai
```

Valeurs supportees:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...

# ou
AI_PROVIDER=gemini
GEMINI_API_KEY=...

# ou
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=...

# Anthropic ne transcrit pas nativement l'audio:
AI_TRANSCRIPTION_PROVIDER=openai
```

Les routes et le frontend ne changent pas.

L'ancien fournisseur de simulation n'est plus supporte; une valeur inconnue provoque une erreur de configuration explicite.

## Streaming

Le contrat JSON historique reste disponible sur `POST /api/ai/voice-assistant`.
Le streaming est opt-in sur `POST /api/ai/voice-assistant/stream` avec SSE:

- `delta`: fragment de `reply_text`;
- `done`: reponse finale complete;
- `error`: erreur IA normalisee.

OpenAI, Gemini et Anthropic implementent le streaming natif. Les timeouts et logs restent geres dans la couche provider.

## Ajouter un nouveau fournisseur

1. Creer `backend/services/ai/providers/NewProvider.js`.
2. Etendre `AIProvider`.
3. Implementer seulement les methodes necessaires.
4. Ajouter le fournisseur dans `AIProviderFactory.js`.
5. Ajouter les variables de configuration dans `aiConfig.js` et `backend/env.example`.

Le reste de l'application continue d'utiliser les services IA existants.

## Points a completer

- Ajouter une selection de modele par usage si necessaire.
- Ajouter tests unitaires pour la factory, les services et la normalisation d'erreurs.
- Ajouter les endpoints applicatifs pour recommandations, traduction et clonage vocal quand ces phases demarrent.
