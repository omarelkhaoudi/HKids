# StoryGenerationService V1

## Endpoints

- `GET /api/generated-stories/kid-profiles`
  - Retourne les profils enfants accessibles par la session connectee.
  - `kid`: son profil lie au compte.
  - `parent`: ses enfants.
  - `admin`: les profils enfants recents.

- `POST /api/generated-stories/generate`
  - Genere une histoire personnalisee et la sauvegarde en base.
  - Authentification requise.
  - Pour `parent` et `admin`, `kid_profile_id` est requis.
  - Pour `kid`, le profil est recupere automatiquement depuis le token.

- `GET /api/generated-stories?kid_profile_id=...&saved=true`
  - Liste les histoires generees pour un enfant autorise.

- `GET /api/generated-stories/:id`
  - Retourne une histoire generee precise si la session a le droit de la lire.

- `POST /api/generated-stories/:id/save`
  - Marque une histoire comme sauvegardee dans la bibliotheque personnelle.

## Donnees en entree

```json
{
  "kid_profile_id": 1,
  "theme": "foret magique",
  "characters": "un doudou, une etoile",
  "estimated_duration_minutes": 5,
  "educational_value": "friendship",
  "language": "fr"
}
```

## Reponse structuree

```json
{
  "id": 12,
  "title": "Lina et le secret foret magique",
  "story_text": "...",
  "story": "...",
  "summary": "Lina vit une aventure douce autour de foret magique.",
  "estimated_duration_minutes": 5,
  "theme": "foret magique",
  "age_level": "first_reader",
  "language": "fr",
  "characters": ["un doudou", "une etoile"],
  "educational_value": "friendship",
  "chapters": [],
  "interactive_choices": [],
  "illustration_plan": {},
  "narration_metadata": {}
}
```

## Modele de donnees

Table `generated_stories`:

- `id`
- `kid_profile_id`
- `user_id`
- `title`
- `story_text`
- `summary`
- `language`
- `theme`
- `age_level`
- `characters`
- `estimated_duration_minutes`
- `educational_value`
- `age_at_generation`
- `prompt_metadata`
- `generation_metadata`
- `chapters`
- `interactive_choices`
- `illustration_plan`
- `narration_metadata`
- `provider`
- `saved`
- `saved_at`
- `created_at`

## Architecture

`StoryGenerationService` ne connait aucun fournisseur concret. Il construit:

- le profil enfant normalise;
- le niveau d'age;
- le prompt optimise;
- le schema de sortie attendu;
- les metadonnees reservees aux futures phases.

Il appelle uniquement:

```js
this.aiProvider.generateStory(...)
```

Le fournisseur actif vient de `AIProviderFactory`.

## Evolutions futures recommandees

- Implementer `OpenAIProvider.generateStory`, `GeminiProvider.generateStory` ou `ClaudeProvider.generateStory`.
- Ajouter une table dediee `generated_story_assets` pour illustrations IA.
- Ajouter un modele `chapters` plus strict pour les histoires longues.
- Ajouter les choix interactifs dans un endpoint dedie.
- Relier `narration_metadata` au futur service de clonage vocal.
- Ajouter tests unitaires sur validation, prompt, mapping DB et droits d'acces.
