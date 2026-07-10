# AI Story Generation V1 Report

## Scope

This V1 adds personalized story generation for the HKids evolution toward Le Lit Qui Lit.

It does not implement voice cloning. It uses the existing browser Text-to-Speech flow to read generated stories aloud.

## Backend Components

- `backend/routes/generatedStories.js`
  - `POST /api/generated-stories/generate`
  - `GET /api/generated-stories`
  - `POST /api/generated-stories/:id/save`
  - Resolves the authorized kid profile from the authenticated kid account, parent account, or admin account.
  - Stores every generated story as history.
  - Marks selected stories as saved for the personal library.

- `backend/services/ai/storyGenerationService.js`
  - Normalizes story inputs.
  - Builds the provider-independent generation call.
  - Applies a provider timeout through `AI_TIMEOUT_MS`.
  - Selects the provider through `AI_PROVIDER`.

- `backend/services/ai/providers/`
  - Implements OpenAI, Gemini, and Anthropic adapters.
  - Uses the same normalized story contract for every provider.

- `backend/database/init.js`
  - Adds `generated_stories`.
  - Stores kid profile, creator user, title, text, language, theme, characters, duration, educational value, age snapshot, provider metadata, history timestamp, and saved status.

## Frontend Components

- `frontend/src/pages/KidsStoryStudio.jsx`
  - Child-facing story studio.
  - Lets the child choose theme, characters, estimated duration, and educational value.
  - Generates a story from the backend.
  - Reads the story with the existing browser TTS service.
  - Saves a story to the personal library.
  - Shows recent generation history.
  - Handles network, timeout, and TTS errors.

- `frontend/src/api/generatedStories.js`
  - API adapter for generate, history, and save endpoints.

- `frontend/src/App.jsx`
  - Adds `/kids/story-studio`.

- `frontend/src/pages/KidsHome.jsx`
  - Adds a visible child-facing entry point to create a story.

## Existing Services Reused

- `frontend/src/services/ai/browserTextToSpeech.js`
  - Reads generated stories aloud with `speechSynthesis`.

- Existing auth context and kid accounts
  - The backend uses `req.user.kid_profile_id` for kid users.

## Current V1 Behavior

1. The child opens `/kids/story-studio`.
2. The child selects generation options.
3. The frontend calls `POST /api/generated-stories/generate`.
4. The backend loads the kid profile:
   - name
   - age
   - preferred language
   - interests
5. The backend generates and stores the story.
6. The frontend displays the story.
7. The child can listen with TTS.
8. The child can save the story.
9. The history list reloads previous generated stories.

## Provider Architecture

The generation service is intentionally provider-independent.

Supported providers:

- `AI_PROVIDER=openai`
- `AI_PROVIDER=gemini`
- `AI_PROVIDER=anthropic`

Each provider implements the same `generateStory({ kid, preferences, prompt, outputSchema })` contract and returns:

```js
{
  title,
  story_text,
  provider_metadata
}
```

## Next Phases

- Add moderation and child-safety validation before saving or reading stories.
- Add richer parent controls for allowed themes and values.
- Add a dedicated saved-story library screen.
- Add illustrated story generation after safety checks.
- Add backend TTS or audio caching if browser TTS is not enough.
- Add tests for route authorization, timeout handling, and provider fallback.
- Add analytics for generation success, saves, and listen actions.
- Keep voice cloning out of scope until parent consent, storage policy, and safety controls are complete.
