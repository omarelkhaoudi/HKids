import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { generatePersonalizedStory, normalizeStoryRequest, validateStoryRequest } from '../services/ai/storyGenerationService.js';
import { aiErrorResponse } from '../services/ai/errors.js';
import { enqueueIllustrationJob, getIllustrationJobStatus, clearIllustrationCache } from '../services/ai/illustrationQueue.js';
import { generateStoryNarration, getNarrationTracks, isNarrationConfigured } from '../services/ai/storyNarrationService.js';
import { buildGeneratedStoryWhereClause, mapGeneratedStory, normalizeStoryListFilters } from '../models/GeneratedStory.js';
import {
  filterAllowedContent,
  getAuthorizedKidProfile,
  getContentAccessViolation,
  getGlobalAccessViolation,
  loadChildAccessPolicy,
  sendParentalAccessError
} from '../services/parental/parentalAccessService.js';

const router = express.Router();

function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

function generatedStoryDescriptor(story) {
  return {
    ...story,
    id: story.id,
    language: story.language,
    theme: story.theme,
    is_premium: false
  };
}

async function getGeneratedStoryViolation(pool, req, kidProfileId, story = null) {
  const policy = await loadChildAccessPolicy({
    user: req.user,
    requestedKidProfileId: kidProfileId,
    pool
  });
  return story
    ? getContentAccessViolation(policy, generatedStoryDescriptor(story))
    : getGlobalAccessViolation(policy);
}

function mapKidProfile(row) {
  return {
    id: row.id,
    parent_id: row.parent_id,
    name: row.name,
    avatar: row.avatar,
    age: row.age,
    preferred_language: row.preferred_language,
    interests: row.interests || []
  };
}

router.get('/kid-profiles', verifyToken, async (req, res) => {
  try {
    const pool = getPool();

    if (req.user.role === 'kid') {
      if (!req.user.kid_profile_id) return res.json([]);

      const result = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [req.user.kid_profile_id]);
      return res.json(result.rows.map(mapKidProfile));
    }

    if (req.user.role === 'parent') {
      const result = await pool.query(
        'SELECT * FROM kids_profiles WHERE parent_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
      return res.json(result.rows.map(mapKidProfile));
    }

    if (req.user.role === 'admin') {
      const result = await pool.query('SELECT * FROM kids_profiles ORDER BY created_at DESC LIMIT 100');
      return res.json(result.rows.map(mapKidProfile));
    }

    res.status(403).json({ error: 'Kid profile access denied' });
  } catch (err) {
    console.error('Error fetching story kid profiles:', err);
    res.status(500).json({ error: 'Could not load kid profiles' });
  }
});

router.post('/generate', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const kid = await getAuthorizedKidProfile(pool, req.user, req.body.kid_profile_id);

    if (!kid) {
      return res.status(403).json({ error: 'Kid profile required or not authorized' });
    }

    const policy = await loadChildAccessPolicy({
      user: req.user,
      requestedKidProfileId: kid.id,
      pool
    });
    const globalViolation = getGlobalAccessViolation(policy);
    if (globalViolation) return sendParentalAccessError(res, globalViolation);

    const validation = validateStoryRequest(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid story generation request',
        code: 'VALIDATION_ERROR',
        details: validation.errors
      });
    }

    const preferences = normalizeStoryRequest(req.body, kid);
    const contentViolation = getContentAccessViolation(policy, {
      language: preferences.language,
      theme: preferences.theme
    }, { includeGlobal: false });
    if (contentViolation) return sendParentalAccessError(res, contentViolation);

    const generated = await generatePersonalizedStory({ kid, preferences });

    if (!generated.story_text) {
      return res.status(502).json({ error: 'Story provider returned an empty story' });
    }

    const result = await pool.query(
      `INSERT INTO generated_stories (
        kid_profile_id,
        user_id,
        title,
        story_text,
        summary,
        language,
        theme,
        age_level,
        characters,
        estimated_duration_minutes,
        educational_value,
        age_at_generation,
        prompt_metadata,
        generation_metadata,
        chapters,
        interactive_choices,
        illustration_plan,
        narration_metadata,
        provider
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        kid.id,
        req.user.id,
        generated.title,
        generated.story_text,
        generated.summary,
        generated.preferences.language,
        generated.theme,
        generated.age_level,
        generated.preferences.characters,
        generated.estimated_duration_minutes,
        generated.preferences.educational_value,
        kid.age || null,
        {
          kid_name: kid.name,
          kid_interests: kid.interests || [],
          ...(generated.prompt_metadata || {}),
          provider_metadata: generated.provider_metadata
        },
        generated.generation_metadata || {},
        generated.chapters || [],
        generated.interactive_choices || [],
        generated.illustration_plan || {},
        generated.narration_metadata || {},
        generated.provider
      ]
    );

    const story = mapGeneratedStory(result.rows[0]);
    res.status(201).json(story);

    // Fire-and-forget: enqueue illustration generation
    enqueueIllustrationJob(story.id);
  } catch (err) {
    if (err?.isAIError) {
      const { status, body } = aiErrorResponse(err);
      return res.status(status).json(body);
    }

    console.error('Error generating story:', err);
    res.status(500).json({ error: 'Story generation failed' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const kid = await getAuthorizedKidProfile(pool, req.user, req.query.kid_profile_id);

    if (!kid) {
      return res.status(403).json({ error: 'Kid profile required or not authorized' });
    }

    const policy = await loadChildAccessPolicy({
      user: req.user,
      requestedKidProfileId: kid.id,
      pool
    });
    const globalViolation = getGlobalAccessViolation(policy);
    if (globalViolation) return sendParentalAccessError(res, globalViolation);

    const filters = normalizeStoryListFilters(req.query);
    const { whereSql, values } = buildGeneratedStoryWhereClause({
      kidProfileId: kid.id,
      filters
    });
    values.push(filters.limit);

    const result = await pool.query(
      `SELECT *
       FROM generated_stories
       WHERE ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${values.length}`,
      values
    );

    const allowedStories = filterAllowedContent(
      policy,
      result.rows.map(generatedStoryDescriptor)
    );
    res.json(allowedStories.map(mapGeneratedStory));
  } catch (err) {
    console.error('Error fetching generated stories:', err);
    res.status(500).json({ error: 'Could not load generated stories' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query('SELECT * FROM generated_stories WHERE id = $1', [req.params.id]);
    const story = storyResult.rows[0];

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) {
      return res.status(403).json({ error: 'Not authorized to read this story' });
    }

    const violation = await getGeneratedStoryViolation(pool, req, kid.id, story);
    if (violation) return sendParentalAccessError(res, violation);

    res.json(mapGeneratedStory(story));
  } catch (err) {
    console.error('Error fetching generated story:', err);
    res.status(500).json({ error: 'Could not load generated story' });
  }
});

router.post('/:id/save', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query('SELECT * FROM generated_stories WHERE id = $1', [req.params.id]);
    const story = storyResult.rows[0];

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) {
      return res.status(403).json({ error: 'Not authorized to save this story' });
    }

    const violation = await getGeneratedStoryViolation(pool, req, kid.id, story);
    if (violation) return sendParentalAccessError(res, violation);

    const result = await pool.query(
      `UPDATE generated_stories
       SET saved = TRUE, saved_at = COALESCE(saved_at, NOW())
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json(mapGeneratedStory(result.rows[0]));
  } catch (err) {
    console.error('Error saving generated story:', err);
    res.status(500).json({ error: 'Could not save generated story' });
  }
});

router.post('/:id/favorite', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query('SELECT * FROM generated_stories WHERE id = $1', [req.params.id]);
    const story = storyResult.rows[0];

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) {
      return res.status(403).json({ error: 'Not authorized to favorite this story' });
    }

    const violation = await getGeneratedStoryViolation(pool, req, kid.id, story);
    if (violation) return sendParentalAccessError(res, violation);

    const favorite = req.body?.favorite !== false;
    const result = await pool.query(
      `UPDATE generated_stories
       SET favorite = $2, favorited_at = CASE WHEN $2 = TRUE THEN COALESCE(favorited_at, NOW()) ELSE NULL END
       WHERE id = $1
       RETURNING *`,
      [req.params.id, favorite]
    );

    res.json(mapGeneratedStory(result.rows[0]));
  } catch (err) {
    console.error('Error updating generated story favorite:', err);
    res.status(500).json({ error: 'Could not update favorite' });
  }
});

router.post('/:id/version', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query('SELECT * FROM generated_stories WHERE id = $1', [req.params.id]);
    const story = storyResult.rows[0];

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) {
      return res.status(403).json({ error: 'Not authorized to regenerate this story' });
    }

    const policy = await loadChildAccessPolicy({
      user: req.user,
      requestedKidProfileId: kid.id,
      pool
    });
    const globalViolation = getGlobalAccessViolation(policy);
    if (globalViolation) return sendParentalAccessError(res, globalViolation);

    const preferences = normalizeStoryRequest({
      theme: req.body?.theme || story.theme,
      characters: req.body?.characters || story.characters || [],
      estimated_duration_minutes: req.body?.estimated_duration_minutes || story.estimated_duration_minutes,
      educational_value: req.body?.educational_value || story.educational_value,
      language: req.body?.language || story.language
    }, kid);
    const contentViolation = getContentAccessViolation(policy, {
      language: preferences.language,
      theme: preferences.theme
    }, { includeGlobal: false });
    if (contentViolation) return sendParentalAccessError(res, contentViolation);

    const generated = await generatePersonalizedStory({ kid, preferences });

    if (!generated.story_text) {
      return res.status(502).json({ error: 'Story provider returned an empty story' });
    }

    const versionResult = await pool.query(
      'SELECT COALESCE(MAX(version_number), 1)::int AS version_number FROM generated_stories WHERE id = $1 OR source_story_id = $1',
      [story.source_story_id || story.id]
    );
    const nextVersionNumber = Number(versionResult.rows[0]?.version_number || 1) + 1;
    const sourceStoryId = story.source_story_id || story.id;

    const result = await pool.query(
      `INSERT INTO generated_stories (
        kid_profile_id,
        user_id,
        title,
        story_text,
        summary,
        language,
        theme,
        age_level,
        characters,
        estimated_duration_minutes,
        educational_value,
        age_at_generation,
        prompt_metadata,
        generation_metadata,
        chapters,
        interactive_choices,
        illustration_plan,
        narration_metadata,
        provider,
        source_story_id,
        version_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        kid.id,
        req.user.id,
        generated.title,
        generated.story_text,
        generated.summary,
        generated.preferences.language,
        generated.theme,
        generated.age_level,
        generated.preferences.characters,
        generated.estimated_duration_minutes,
        generated.preferences.educational_value,
        kid.age || null,
        {
          kid_name: kid.name,
          kid_interests: kid.interests || [],
          ...(generated.prompt_metadata || {}),
          provider_metadata: generated.provider_metadata,
          regenerated_from_story_id: story.id
        },
        {
          ...(generated.generation_metadata || {}),
          source_story_id: sourceStoryId,
          version_number: nextVersionNumber
        },
        generated.chapters || [],
        generated.interactive_choices || [],
        generated.illustration_plan || {},
        generated.narration_metadata || {},
        generated.provider,
        sourceStoryId,
        nextVersionNumber
      ]
    );

    const newStory = mapGeneratedStory(result.rows[0]);
    res.status(201).json(newStory);

    // Fire-and-forget: enqueue illustration generation
    enqueueIllustrationJob(newStory.id);
  } catch (err) {
    if (err?.isAIError) {
      const { status, body } = aiErrorResponse(err);
      return res.status(status).json(body);
    }

    console.error('Error regenerating generated story:', err);
    res.status(500).json({ error: 'Could not create a new version' });
  }
});

// Get illustration status for a story
router.get('/:id/illustrations', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query('SELECT id, kid_profile_id, illustration_plan, cover_image_url FROM generated_stories WHERE id = $1', [req.params.id]);
    const story = storyResult.rows[0];
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) return res.status(403).json({ error: 'Not authorized' });

    const queueStatus = getIllustrationJobStatus(story.id);
    res.json({
      illustration_plan: story.illustration_plan || {},
      cover_image_url: story.cover_image_url || null,
      queue: queueStatus,
    });
  } catch (err) {
    console.error('Error fetching illustration status:', err);
    res.status(500).json({ error: 'Could not fetch illustration status' });
  }
});

// Regenerate illustrations for a story
router.post('/:id/illustrations/regenerate', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query('SELECT id, kid_profile_id FROM generated_stories WHERE id = $1', [req.params.id]);
    const story = storyResult.rows[0];
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) return res.status(403).json({ error: 'Not authorized' });

    clearIllustrationCache(story.id);
    const result = enqueueIllustrationJob(story.id, { force: true });
    res.json({ message: 'Illustration regeneration queued', ...result });
  } catch (err) {
    console.error('Error regenerating illustrations:', err);
    res.status(500).json({ error: 'Could not regenerate illustrations' });
  }
});

// Get narration tracks for a story
router.get('/:id/narrations', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query(
      'SELECT id, kid_profile_id, narration_metadata FROM generated_stories WHERE id = $1',
      [req.params.id]
    );
    const story = storyResult.rows[0];
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) return res.status(403).json({ error: 'Not authorized' });

    const tracks = getNarrationTracks(story.narration_metadata);
    res.json({ story_id: story.id, configured: isNarrationConfigured(), tracks });
  } catch (err) {
    console.error('Error fetching narration tracks:', err);
    res.status(500).json({ error: 'Could not fetch narration tracks' });
  }
});

// Generate narration for a specific locale
router.post('/:id/narrations/:locale', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query(
      'SELECT id, kid_profile_id FROM generated_stories WHERE id = $1',
      [req.params.id]
    );
    const story = storyResult.rows[0];
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) return res.status(403).json({ error: 'Not authorized' });

    if (!isNarrationConfigured()) {
      return res.status(503).json({ error: 'Narration service is not configured', code: 'NARRATION_UNAVAILABLE' });
    }

    const force = req.body?.force === true;
    const result = await generateStoryNarration(story.id, req.params.locale, { force });
    res.json(result);
  } catch (err) {
    console.error('Error generating narration:', err);
    res.status(500).json({ error: err.message || 'Narration generation failed' });
  }
});

// Generate narrations for all configured locales
router.post('/:id/narrations', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query(
      'SELECT id, kid_profile_id FROM generated_stories WHERE id = $1',
      [req.params.id]
    );
    const story = storyResult.rows[0];
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) return res.status(403).json({ error: 'Not authorized' });

    if (!isNarrationConfigured()) {
      return res.status(503).json({ error: 'Narration service is not configured', code: 'NARRATION_UNAVAILABLE' });
    }

    const { generateAllNarrations } = await import('../services/ai/storyNarrationService.js');
    const force = req.body?.force === true;
    const results = await generateAllNarrations(story.id, { force });
    res.json({ story_id: story.id, results });
  } catch (err) {
    console.error('Error generating all narrations:', err);
    res.status(500).json({ error: err.message || 'Narration generation failed' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const storyResult = await pool.query('SELECT * FROM generated_stories WHERE id = $1', [req.params.id]);
    const story = storyResult.rows[0];

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const kid = await getAuthorizedKidProfile(pool, req.user, story.kid_profile_id);
    if (!kid) {
      return res.status(403).json({ error: 'Not authorized to delete this story' });
    }

    const violation = await getGeneratedStoryViolation(pool, req, kid.id, story);
    if (violation) return sendParentalAccessError(res, violation);

    await pool.query('DELETE FROM generated_stories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Generated story deleted successfully' });
  } catch (err) {
    console.error('Error deleting generated story:', err);
    res.status(500).json({ error: 'Could not delete generated story' });
  }
});

export default router;
