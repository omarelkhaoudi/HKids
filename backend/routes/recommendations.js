import express from 'express';
import crypto from 'crypto';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { RecommendationService } from '../services/ai/RecommendationService.js';

const router = express.Router();
const recommendationService = new RecommendationService();
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

function getCacheKey({ kidProfileId, context }) {
  const contextHash = crypto
    .createHash('sha1')
    .update(JSON.stringify(context || {}))
    .digest('hex');
  return `${kidProfileId}:${contextHash}`;
}

function getCachedRecommendations(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedRecommendations(key, value) {
  cache.set(key, {
    value,
    createdAt: Date.now(),
  });

  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

async function getAuthorizedKid(pool, req, requestedKidProfileId = null) {
  if (req.user.role === 'kid') {
    if (!req.user.kid_profile_id) return null;
    const result = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [req.user.kid_profile_id]);
    return result.rows[0] || null;
  }

  if (req.user.role === 'parent') {
    if (!requestedKidProfileId) return null;
    const result = await pool.query(
      'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2',
      [requestedKidProfileId, req.user.id]
    );
    return result.rows[0] || null;
  }

  if (req.user.role === 'admin') {
    if (!requestedKidProfileId) return null;
    const result = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [requestedKidProfileId]);
    return result.rows[0] || null;
  }

  return null;
}

function normalizeClientContext(body = {}) {
  const limitArray = (value, limit = 50) => (Array.isArray(value) ? value.slice(0, limit) : []);
  return {
    favorites: limitArray(body.favorites),
    readingHistory: limitArray(body.readingHistory),
    listeningHistory: limitArray(body.listeningHistory),
    readingStats: body.readingStats && typeof body.readingStats === 'object' ? body.readingStats : {},
  };
}

router.post('/', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const requestedKidProfileId = req.body?.kid_profile_id || req.query?.kid_profile_id;
    const kid = await getAuthorizedKid(pool, req, requestedKidProfileId);

    if (!kid) {
      return res.status(403).json({ error: 'Kid profile required or not authorized' });
    }

    const context = normalizeClientContext(req.body);
    const cacheKey = getCacheKey({ kidProfileId: kid.id, context });
    const cached = getCachedRecommendations(cacheKey);

    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }

    const result = await pool.query(
      `SELECT
         b.*,
         c.name AS category_name,
         sc.name AS subcategory_name,
         COALESCE(global_stats.global_listens, 0)::int AS global_listens,
         COALESCE(global_stats.global_listening_seconds, 0)::int AS global_listening_seconds,
         COALESCE(kid_stats.kid_listens, 0)::int AS kid_listens,
         COALESCE(kid_stats.kid_total_listening_seconds, 0)::int AS kid_total_listening_seconds,
         COALESCE(progress.progress_percent, 0)::int AS kid_progress_percent,
         COALESCE(progress.current_page, 0)::int AS kid_current_page,
         COALESCE(progress.completed, FALSE) AS kid_completed,
         progress.last_read_at AS kid_last_read_at
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN categories sc ON b.subcategory_id = sc.id
       LEFT JOIN (
         SELECT book_id, COUNT(*) AS global_listens, SUM(duration_seconds) AS global_listening_seconds
         FROM kid_reading_sessions
         GROUP BY book_id
       ) global_stats ON global_stats.book_id = b.id
       LEFT JOIN (
         SELECT book_id, COUNT(*) AS kid_listens, SUM(duration_seconds) AS kid_total_listening_seconds
         FROM kid_reading_sessions
         WHERE kid_profile_id = $1
         GROUP BY book_id
       ) kid_stats ON kid_stats.book_id = b.id
       LEFT JOIN kid_reading_progress progress
         ON progress.book_id = b.id AND progress.kid_profile_id = $1
       WHERE b.is_published = TRUE
         AND (b.publish_at IS NULL OR b.publish_at <= NOW())
         AND b.age_group_min <= COALESCE($2, b.age_group_min)
         AND b.age_group_max >= COALESCE($2, b.age_group_max)
         AND (
           NOT EXISTS (
             SELECT 1 FROM parent_approvals pa
             WHERE pa.kid_profile_id = $1
           )
           OR b.category_id IN (
             SELECT pa.category_id FROM parent_approvals pa
             WHERE pa.kid_profile_id = $1 AND pa.approved = TRUE
           )
         )
         AND (
           NOT EXISTS (
             SELECT 1 FROM parental_rules pr
             WHERE pr.kid_profile_id = $1
               AND cardinality(pr.allowed_languages) > 0
           )
           OR b.language = ANY(COALESCE((
             SELECT pr.allowed_languages FROM parental_rules pr
             WHERE pr.kid_profile_id = $1
             LIMIT 1
           ), ARRAY[]::text[]))
         )
         AND (
           NOT EXISTS (
             SELECT 1 FROM parental_rules pr
             WHERE pr.kid_profile_id = $1
               AND cardinality(pr.allowed_themes) > 0
           )
           OR b.theme = ANY(COALESCE((
             SELECT pr.allowed_themes FROM parental_rules pr
             WHERE pr.kid_profile_id = $1
             LIMIT 1
           ), ARRAY[]::text[]))
         )
       ORDER BY b.created_at DESC
       LIMIT 120`,
      [kid.id, kid.age || null]
    );

    const recommendations = await recommendationService.recommendContent({
      kid,
      contents: result.rows,
      context,
    });

    const response = {
      kid_profile_id: kid.id,
      generated_at: new Date().toISOString(),
      cached: false,
      ...recommendations,
    };

    setCachedRecommendations(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('Error creating recommendations:', err);
    res.status(500).json({ error: 'Could not load recommendations' });
  }
});

router.get('/cache/status', verifyToken, (req, res) => {
  res.json({
    entries: cache.size,
    ttl_ms: CACHE_TTL_MS,
  });
});

export default router;
