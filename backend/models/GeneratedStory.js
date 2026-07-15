export function mapGeneratedStory(row) {
  const storyText = row.story_text || '';

  return {
    id: row.id,
    kid_profile_id: row.kid_profile_id,
    user_id: row.user_id,
    title: row.title,
    story_text: storyText,
    story: storyText,
    summary: row.summary || '',
    language: row.language,
    theme: row.theme,
    age_level: row.age_level,
    characters: row.characters || [],
    estimated_duration_minutes: Number(row.estimated_duration_minutes || 5),
    educational_value: row.educational_value,
    age_at_generation: row.age_at_generation,
    prompt_metadata: row.prompt_metadata || {},
    generation_metadata: row.generation_metadata || {},
    chapters: row.chapters || [],
    interactive_choices: row.interactive_choices || [],
    illustration_plan: row.illustration_plan || {},
    cover_image_url: row.cover_image_url || null,
    narration_metadata: row.narration_metadata || {},
    provider: row.provider,
    saved: row.saved === true,
    saved_at: row.saved_at,
    favorite: row.favorite === true,
    favorited_at: row.favorited_at,
    source_story_id: row.source_story_id,
    version_number: Number(row.version_number || 1),
    created_at: row.created_at
  };
}

export function normalizeStoryListFilters(query = {}) {
  return {
    search: String(query.search || '').trim().slice(0, 120),
    theme: String(query.theme || '').trim().slice(0, 80),
    language: String(query.language || '').trim().slice(0, 12),
    age_level: String(query.age_level || '').trim().slice(0, 40),
    educational_value: String(query.educational_value || '').trim().slice(0, 40),
    saved: query.saved === 'true' ? true : query.saved === 'false' ? false : null,
    favorite: query.favorite === 'true' ? true : query.favorite === 'false' ? false : null,
    limit: Math.min(100, Math.max(1, Number.parseInt(query.limit || '30', 10) || 30))
  };
}

export function buildGeneratedStoryWhereClause({ kidProfileId, filters }) {
  const clauses = ['kid_profile_id = $1', 'COALESCE(is_hidden, FALSE) = FALSE'];
  const values = [kidProfileId];

  const addValue = (value) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.saved !== null) {
    clauses.push(`saved = ${addValue(filters.saved)}`);
  }

  if (filters.favorite !== null) {
    clauses.push(`favorite = ${addValue(filters.favorite)}`);
  }

  if (filters.theme) {
    clauses.push(`theme = ${addValue(filters.theme)}`);
  }

  if (filters.language) {
    clauses.push(`language = ${addValue(filters.language)}`);
  }

  if (filters.age_level) {
    clauses.push(`age_level = ${addValue(filters.age_level)}`);
  }

  if (filters.educational_value) {
    clauses.push(`educational_value = ${addValue(filters.educational_value)}`);
  }

  if (filters.search) {
    const searchParam = addValue(`%${filters.search.toLowerCase()}%`);
    clauses.push(`(
      lower(title) LIKE ${searchParam}
      OR lower(COALESCE(summary, '')) LIKE ${searchParam}
      OR lower(story_text) LIKE ${searchParam}
      OR lower(COALESCE(theme, '')) LIKE ${searchParam}
    )`);
  }

  return {
    whereSql: clauses.join(' AND '),
    values
  };
}
