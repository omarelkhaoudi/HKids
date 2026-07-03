import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { generatePersonalizedStory, normalizeStoryRequest } from '../services/ai/storyGenerationService.js';

const router = express.Router();

function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

async function getAuthorizedKid(pool, req, requestedKidProfileId = null) {
  if (req.user.role === 'kid') {
    if (!req.user.kid_profile_id) return null;
    const result = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [req.user.kid_profile_id]);
    return result.rows[0] || null;
  }

  if (req.user.role === 'parent') {
    const kidProfileId = requestedKidProfileId;
    if (!kidProfileId) return null;
    const result = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [kidProfileId, req.user.id]
    );
    return result.rows[0] || null;
  }

  if (req.user.role === 'admin') {
    const kidProfileId = requestedKidProfileId;
    if (!kidProfileId) return null;
    const result = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [kidProfileId]);
    return result.rows[0] || null;
  }

  return null;
}

function mapStory(row) {
  return {
    id: row.id,
    kid_profile_id: row.kid_profile_id,
    title: row.title,
    story_text: row.story_text,
    language: row.language,
    theme: row.theme,
    characters: row.characters || [],
    estimated_duration_minutes: Number(row.estimated_duration_minutes || 5),
    educational_value: row.educational_value,
    age_at_generation: row.age_at_generation,
    prompt_metadata: row.prompt_metadata || {},
    provider: row.provider,
    saved: row.saved === true,
    saved_at: row.saved_at,
    created_at: row.created_at
  };
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
    const kid = await getAuthorizedKid(pool, req, req.body.kid_profile_id);

    if (!kid) {
      return res.status(403).json({ error: 'Kid profile required or not authorized' });
    }

    const preferences = normalizeStoryRequest(req.body, kid);
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
        language,
        theme,
        characters,
        estimated_duration_minutes,
        educational_value,
        age_at_generation,
        prompt_metadata,
        provider
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        kid.id,
        req.user.id,
        generated.title,
        generated.story_text,
        generated.preferences.language,
        generated.preferences.theme,
        generated.preferences.characters,
        generated.preferences.estimated_duration_minutes,
        generated.preferences.educational_value,
        kid.age || null,
        {
          kid_name: kid.name,
          kid_interests: kid.interests || [],
          provider_metadata: generated.provider_metadata
        },
        generated.provider
      ]
    );

    res.status(201).json(mapStory(result.rows[0]));
  } catch (err) {
    if (err.message === 'story_generation_timeout') {
      return res.status(504).json({ error: 'Story generation timed out. Please try again.' });
    }

    console.error('Error generating story:', err);
    res.status(500).json({ error: 'Story generation failed' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const kid = await getAuthorizedKid(pool, req, req.query.kid_profile_id);

    if (!kid) {
      return res.status(403).json({ error: 'Kid profile required or not authorized' });
    }

    const savedOnly = req.query.saved === 'true';
    const result = await pool.query(
      `SELECT *
       FROM generated_stories
       WHERE kid_profile_id = $1
         AND ($2::boolean = FALSE OR saved = TRUE)
       ORDER BY created_at DESC
       LIMIT 30`,
      [kid.id, savedOnly]
    );

    res.json(result.rows.map(mapStory));
  } catch (err) {
    console.error('Error fetching generated stories:', err);
    res.status(500).json({ error: 'Could not load generated stories' });
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

    const kid = await getAuthorizedKid(pool, req, story.kid_profile_id);
    if (!kid) {
      return res.status(403).json({ error: 'Not authorized to save this story' });
    }

    const result = await pool.query(
      `UPDATE generated_stories
       SET saved = TRUE, saved_at = COALESCE(saved_at, NOW())
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    res.json(mapStory(result.rows[0]));
  } catch (err) {
    console.error('Error saving generated story:', err);
    res.status(500).json({ error: 'Could not save generated story' });
  }
});

export default router;
