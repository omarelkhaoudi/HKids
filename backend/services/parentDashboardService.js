import { getDatabase } from '../database/init.js';
import {
  getContentAccessViolation,
  loadChildAccessPolicy
} from './parental/parentalAccessService.js';

const CACHE_TTL_MS = 60_000;
const CACHE_TTL_SECONDS = CACHE_TTL_MS / 1000;
const MAX_CACHE_ENTRIES = 500;
const memoryCache = new Map();

let redisClient = null;
let redisReady = false;
let redisDisabled = false;

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function cacheKey(kidId, options) {
  return `parent-dashboard:kid:${kidId}:${JSON.stringify(options)}`;
}

async function getRedisClient() {
  if (redisDisabled || !process.env.REDIS_URL) return null;
  if (redisClient && redisReady) return redisClient;
  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (error) => {
      console.warn('[parent-dashboard-cache] Redis error:', error.message);
    });
    await redisClient.connect();
    redisReady = true;
    return redisClient;
  } catch (error) {
    redisDisabled = true;
    console.warn('[parent-dashboard-cache] Redis unavailable, using memory fallback:', error.message);
    return null;
  }
}

function readMemoryCache(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt >= CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function writeMemoryCache(key, value) {
  memoryCache.set(key, { value, createdAt: Date.now() });
  if (memoryCache.size > MAX_CACHE_ENTRIES) {
    memoryCache.delete(memoryCache.keys().next().value);
  }
}

async function readCache(key) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('[parent-dashboard-cache] Redis read failed:', error.message);
    }
  }
  return readMemoryCache(key);
}

async function writeCache(key, value) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.setEx(key, CACHE_TTL_SECONDS, JSON.stringify(value));
      return;
    } catch (error) {
      console.warn('[parent-dashboard-cache] Redis write failed:', error.message);
    }
  }
  writeMemoryCache(key, value);
}

export async function invalidateParentDashboardCache(kidProfileId) {
  const prefix = `parent-dashboard:kid:${kidProfileId}:`;
  const redis = await getRedisClient();
  if (redis) {
    try {
      for await (const key of redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
        await redis.del(key);
      }
    } catch (error) {
      console.warn('[parent-dashboard-cache] Redis invalidation failed:', error.message);
    }
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
}

export function getParentDashboardCacheInfo() {
  const configuredBackend = process.env.REDIS_URL && !redisDisabled ? 'redis' : 'memory';
  return {
    backend: redisReady ? 'redis' : configuredBackend,
    ttl_seconds: CACHE_TTL_SECONDS,
    entries: memoryCache.size
  };
}

function buildBadges(summary, progressRows) {
  const totalMinutes = Math.floor(Number(summary.total_time_seconds || 0) / 60);
  const totalSessions = Number(summary.total_sessions || 0);
  const completedBooks = Number(summary.completed_books || 0);
  const activeBooks = Number(summary.active_books || progressRows.length);

  return [
    {
      id: 'first_steps',
      label: 'Premier pas',
      description: 'Premiere session de lecture terminee',
      icon: '📖',
      earned: totalSessions >= 1
    },
    {
      id: 'ten_minutes',
      label: '10 minutes de lecture',
      description: 'A lu au moins 10 minutes au total',
      icon: '⏱️',
      earned: totalMinutes >= 10
    },
    {
      id: 'first_book',
      label: 'Premier livre termine',
      description: 'A termine son premier livre',
      icon: '📚',
      earned: completedBooks >= 1
    },
    {
      id: 'regular_reader',
      label: 'Lecteur regulier',
      description: 'A realise au moins 5 sessions',
      icon: '🔥',
      earned: totalSessions >= 5
    },
    {
      id: 'explorer',
      label: 'Explorateur',
      description: 'A commence au moins 3 livres differents',
      icon: '🧭',
      earned: activeBooks >= 3
    }
  ];
}

async function requireAccessibleKid(pool, user, kidProfileId) {
  const query = user.role === 'admin'
    ? `SELECT id, parent_id, name, avatar, photo_url, age, preferred_language, interests
       FROM kids_profiles WHERE id = $1`
    : `SELECT id, parent_id, name, avatar, photo_url, age, preferred_language, interests
       FROM kids_profiles WHERE id = $1 AND parent_id = $2`;
  const params = user.role === 'admin' ? [kidProfileId] : [kidProfileId, user.id];
  const result = await pool.query(query, params);
  if (!result.rows[0]) throw httpError(404, 'Kid profile not found', 'KID_NOT_FOUND');
  return result.rows[0];
}

function buildStreak(dailyActivity) {
  let streak = 0;
  for (let index = dailyActivity.length - 1; index >= 0; index -= 1) {
    const day = dailyActivity[index];
    const active = Number(day.reading_seconds) + Number(day.screen_seconds) + Number(day.quiz_seconds) > 0;
    if (!active) {
      if (index === dailyActivity.length - 1) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}

function goalWindow(period) {
  if (period === 'daily') return "date_trunc('day', NOW())";
  if (period === 'monthly') return "date_trunc('month', NOW())";
  return "date_trunc('week', NOW())";
}

async function loadGoal(pool, kidId) {
  const result = await pool.query(
    `SELECT * FROM kid_reading_goals
     WHERE kid_profile_id = $1 AND active = TRUE
     ORDER BY updated_at DESC LIMIT 1`,
    [kidId]
  );
  const goal = result.rows[0];
  if (!goal) return null;

  const windowStart = goalWindow(goal.period);
  let progressQuery;
  if (goal.goal_type === 'completed_books') {
    progressQuery = `SELECT COUNT(*)::int AS value FROM kid_reading_progress
      WHERE kid_profile_id = $1 AND completed = TRUE AND completed_at >= ${windowStart}`;
  } else if (goal.goal_type === 'sessions') {
    progressQuery = `SELECT COUNT(*)::int AS value FROM kid_reading_sessions
      WHERE kid_profile_id = $1 AND created_at >= ${windowStart}`;
  } else {
    progressQuery = `SELECT FLOOR(COALESCE(SUM(duration_seconds), 0) / 60)::int AS value
      FROM kid_reading_sessions WHERE kid_profile_id = $1 AND created_at >= ${windowStart}`;
  }
  const progress = await pool.query(progressQuery, [kidId]);
  const value = Number(progress.rows[0]?.value || 0);
  const target = Math.max(1, Number(goal.target_value || 1));
  return {
    ...goal,
    progress_value: value,
    progress_percent: Math.min(100, Math.round((value / target) * 100)),
    achieved: value >= target
  };
}

async function loadDashboardLists(pool, kidId, options) {
  const {
    favoritesLimit,
    favoritesOffset,
    historyLimit,
    historyOffset,
    timelineLimit,
    timelineOffset
  } = options;

  const [favorites, favoritesCount, history, historyCount, timeline, timelineCount] = await Promise.all([
    pool.query(
      `SELECT f.book_id, f.favorited_at, b.title, b.cover_image, b.author
       FROM kid_book_favorites f
       JOIN books b ON b.id = f.book_id
       WHERE f.kid_profile_id = $1
       ORDER BY f.favorited_at DESC
       LIMIT $2 OFFSET $3`,
      [kidId, favoritesLimit, favoritesOffset]
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM kid_book_favorites WHERE kid_profile_id = $1', [kidId]),
    pool.query(
      `SELECT h.book_id, h.last_page, h.open_count, h.listened_seconds,
              h.audio_duration_seconds, h.completed, h.last_opened_at,
              h.last_listened_at, b.title, b.cover_image
       FROM kid_book_history h
       JOIN books b ON b.id = h.book_id
       WHERE h.kid_profile_id = $1
       ORDER BY GREATEST(h.last_opened_at, COALESCE(h.last_listened_at, h.last_opened_at)) DESC
       LIMIT $2 OFFSET $3`,
      [kidId, historyLimit, historyOffset]
    ),
    pool.query('SELECT COUNT(*)::int AS total FROM kid_book_history WHERE kid_profile_id = $1', [kidId]),
    pool.query(
      `WITH events AS (
         SELECT 'reading'::text AS type, b.title,
                s.created_at AS occurred_at,
                jsonb_build_object(
                  'book_id', s.book_id,
                  'duration_seconds', s.duration_seconds,
                  'completed', s.completed,
                  'page_reached', s.page_reached
                ) AS metadata
         FROM kid_reading_sessions s
         JOIN books b ON b.id = s.book_id
         WHERE s.kid_profile_id = $1
         UNION ALL
         SELECT 'quiz'::text, lc.title, a.created_at,
                jsonb_build_object(
                  'content_id', a.content_id,
                  'score', a.score,
                  'max_score', a.max_score,
                  'success', a.success,
                  'duration_seconds', a.time_spent_seconds
                )
         FROM learning_attempts a
         JOIN learning_contents lc ON lc.id = a.content_id
         WHERE a.kid_profile_id = $1
         UNION ALL
         SELECT 'favorite'::text, b.title, f.favorited_at,
                jsonb_build_object('book_id', f.book_id)
         FROM kid_book_favorites f
         JOIN books b ON b.id = f.book_id
         WHERE f.kid_profile_id = $1
       )
       SELECT * FROM events
       ORDER BY occurred_at DESC
       LIMIT $2 OFFSET $3`,
      [kidId, timelineLimit, timelineOffset]
    ),
    pool.query(
      `SELECT (
         (SELECT COUNT(*) FROM kid_reading_sessions WHERE kid_profile_id = $1)
         + (SELECT COUNT(*) FROM learning_attempts WHERE kid_profile_id = $1)
         + (SELECT COUNT(*) FROM kid_book_favorites WHERE kid_profile_id = $1)
       )::int AS total`,
      [kidId]
    )
  ]);

  return {
    favorites: {
      items: favorites.rows,
      total: Number(favoritesCount.rows[0]?.total || 0),
      limit: favoritesLimit,
      offset: favoritesOffset
    },
    history: {
      items: history.rows,
      total: Number(historyCount.rows[0]?.total || 0),
      limit: historyLimit,
      offset: historyOffset
    },
    timeline: {
      items: timeline.rows,
      total: Number(timelineCount.rows[0]?.total || 0),
      limit: timelineLimit,
      offset: timelineOffset
    }
  };
}

export async function getParentDashboardSnapshot({
  user,
  kidProfileId,
  days = 7,
  favoritesLimit = 20,
  favoritesOffset = 0,
  historyLimit = 50,
  historyOffset = 0,
  timelineLimit = 50,
  timelineOffset = 0
}) {
  const options = {
    days,
    favoritesLimit,
    favoritesOffset,
    historyLimit,
    historyOffset,
    timelineLimit,
    timelineOffset
  };
  const key = cacheKey(kidProfileId, { userId: user.id, role: user.role, ...options });
  const pool = getDatabase();
  const kid = await requireAccessibleKid(pool, user, kidProfileId);
  const cached = await readCache(key);
  if (cached) return { ...cached, cache: { hit: true, ...getParentDashboardCacheInfo() } };

  const [summaryResult, dailyResult, progressResult, lists, subscriptionResult, goal] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE((SELECT SUM(duration_seconds) FROM kid_reading_sessions WHERE kid_profile_id = $1), 0)::int AS reading_seconds,
         COALESCE((SELECT COUNT(*) FROM kid_reading_sessions WHERE kid_profile_id = $1), 0)::int AS reading_sessions,
         COALESCE((SELECT COUNT(*) FROM kid_reading_progress WHERE kid_profile_id = $1), 0)::int AS books_started,
         COALESCE((SELECT COUNT(*) FROM kid_reading_progress WHERE kid_profile_id = $1 AND completed = TRUE), 0)::int AS books_completed,
         COALESCE((SELECT ROUND(AVG(progress_percent)) FROM kid_reading_progress WHERE kid_profile_id = $1), 0)::int AS average_progress_percent,
         COALESCE((SELECT SUM(duration_seconds) FROM kid_screen_time_sessions
                   WHERE kid_profile_id = $1 AND started_at >= date_trunc('day', NOW())), 0)::int AS screen_seconds_today,
         COALESCE((SELECT SUM(duration_seconds) FROM kid_screen_time_sessions
                   WHERE kid_profile_id = $1 AND started_at >= CURRENT_DATE - ($2::int - 1)), 0)::int AS screen_seconds_period,
         COALESCE((SELECT COUNT(*) FROM learning_attempts WHERE kid_profile_id = $1), 0)::int AS quiz_attempts,
         COALESCE((SELECT COUNT(*) FROM learning_attempts WHERE kid_profile_id = $1 AND success = TRUE), 0)::int AS quiz_successes,
         COALESCE((SELECT ROUND(AVG(CASE WHEN max_score > 0 THEN score::numeric / max_score * 100 END))
                   FROM learning_attempts WHERE kid_profile_id = $1), 0)::int AS average_quiz_score,
         COALESCE((SELECT SUM(time_spent_seconds) FROM learning_attempts WHERE kid_profile_id = $1), 0)::int AS quiz_seconds,
         COALESCE((SELECT daily_screen_time_minutes FROM parental_rules WHERE kid_profile_id = $1), 30)::int AS daily_screen_limit_minutes`,
      [kidProfileId, days]
    ),
    pool.query(
      `WITH calendar AS (
         SELECT generate_series(
           CURRENT_DATE - ($2::int - 1),
           CURRENT_DATE,
           INTERVAL '1 day'
         )::date AS day
       ),
       reading AS (
         SELECT created_at::date AS day, SUM(duration_seconds)::int AS seconds
         FROM kid_reading_sessions
         WHERE kid_profile_id = $1 AND created_at >= CURRENT_DATE - ($2::int - 1)
         GROUP BY created_at::date
       ),
       screen AS (
         SELECT started_at::date AS day, SUM(duration_seconds)::int AS seconds
         FROM kid_screen_time_sessions
         WHERE kid_profile_id = $1 AND started_at >= CURRENT_DATE - ($2::int - 1)
         GROUP BY started_at::date
       ),
       quiz AS (
         SELECT created_at::date AS day, SUM(time_spent_seconds)::int AS seconds,
                COUNT(*)::int AS attempts, COUNT(*) FILTER (WHERE success)::int AS successes
         FROM learning_attempts
         WHERE kid_profile_id = $1 AND created_at >= CURRENT_DATE - ($2::int - 1)
         GROUP BY created_at::date
       )
       SELECT c.day,
              COALESCE(r.seconds, 0)::int AS reading_seconds,
              COALESCE(s.seconds, 0)::int AS screen_seconds,
              COALESCE(q.seconds, 0)::int AS quiz_seconds,
              COALESCE(q.attempts, 0)::int AS quiz_attempts,
              COALESCE(q.successes, 0)::int AS quiz_successes
       FROM calendar c
       LEFT JOIN reading r ON r.day = c.day
       LEFT JOIN screen s ON s.day = c.day
       LEFT JOIN quiz q ON q.day = c.day
       ORDER BY c.day`,
      [kidProfileId, days]
    ),
    pool.query(
      `SELECT p.book_id, p.current_page, p.total_pages, p.progress_percent,
              p.completed, p.last_read_at, b.title, b.cover_image
       FROM kid_reading_progress p
       JOIN books b ON b.id = p.book_id
       WHERE p.kid_profile_id = $1
       ORDER BY p.last_read_at DESC
       LIMIT 12`,
      [kidProfileId]
    ),
    loadDashboardLists(pool, kidProfileId, options),
    pool.query(
      `SELECT us.status, us.current_period_end, us.cancel_at_period_end,
              sp.code AS plan_code, sp.name AS plan_name, sp.book_limit
       FROM user_subscriptions us
       JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.user_id = $1 AND us.status IN ('active', 'trialing')
       ORDER BY us.created_at DESC LIMIT 1`,
      [kid.parent_id]
    ),
    loadGoal(pool, kidProfileId)
  ]);

  const dailyActivity = dailyResult.rows;
  const summary = {
    ...summaryResult.rows[0],
    reading_streak_days: buildStreak(dailyActivity),
    screen_remaining_seconds_today: Math.max(
      0,
      Number(summaryResult.rows[0].daily_screen_limit_minutes || 0) * 60
        - Number(summaryResult.rows[0].screen_seconds_today || 0)
    )
  };
  const payload = {
    kid,
    period: { days },
    summary,
    goal,
    daily_activity: dailyActivity,
    progress: { items: progressResult.rows, limit: 12 },
    favorites: lists.favorites,
    history: lists.history,
    timeline: lists.timeline,
    subscription: subscriptionResult.rows[0] || null,
    generated_at: new Date().toISOString()
  };
  await writeCache(key, payload);
  return { ...payload, cache: { hit: false, ...getParentDashboardCacheInfo() } };
}

async function loadKidActivitySnapshot(pool, kidProfileId) {
  const [summaryResult, progressResult, sessionsResult, goal] = await Promise.all([
    pool.query(
      `SELECT
        COALESCE(SUM(duration_seconds), 0)::int AS total_time_seconds,
        COUNT(*)::int AS total_sessions,
        COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0)::int AS completed_sessions,
        (
          SELECT COUNT(*)::int
          FROM kid_reading_progress
          WHERE kid_profile_id = $1 AND completed = TRUE
        ) AS completed_books,
        (
          SELECT COUNT(*)::int
          FROM kid_reading_progress
          WHERE kid_profile_id = $1
        ) AS active_books
      FROM kid_reading_sessions
      WHERE kid_profile_id = $1`,
      [kidProfileId]
    ),
    pool.query(
      `SELECT
        krp.*,
        b.title AS book_title,
        b.cover_image,
        b.page_count
      FROM kid_reading_progress krp
      JOIN books b ON b.id = krp.book_id
      WHERE krp.kid_profile_id = $1
      ORDER BY krp.last_read_at DESC
      LIMIT 8`,
      [kidProfileId]
    ),
    pool.query(
      `SELECT
        krs.*,
        b.title AS book_title
      FROM kid_reading_sessions krs
      JOIN books b ON b.id = krs.book_id
      WHERE krs.kid_profile_id = $1
      ORDER BY krs.created_at DESC
      LIMIT 10`,
      [kidProfileId]
    ),
    loadGoal(pool, kidProfileId)
  ]);

  const summary = summaryResult.rows[0];
  return {
    summary,
    goal,
    badges: buildBadges(summary, progressResult.rows),
    progress: progressResult.rows,
    recent_sessions: sessionsResult.rows
  };
}

async function assertKidActivityAccess(pool, user, kidProfileId) {
  if (user.role === 'kid') {
    if (Number(user.kid_profile_id) !== Number(kidProfileId)) {
      throw httpError(403, 'Access denied', 'ACCESS_DENIED');
    }
    return;
  }
  if (user.role === 'admin') {
    await requireAccessibleKid(pool, user, kidProfileId);
    return;
  }
  const result = await pool.query(
    'SELECT id FROM kids_profiles WHERE id = $1 AND parent_id = $2',
    [kidProfileId, user.id]
  );
  if (!result.rows[0]) throw httpError(404, 'Kid profile not found', 'KID_NOT_FOUND');
}

export async function getKidActivitySnapshot({ user, kidProfileId }) {
  const pool = getDatabase();
  await assertKidActivityAccess(pool, user, kidProfileId);
  return loadKidActivitySnapshot(pool, kidProfileId);
}

export async function getConnectedKidOverview(user) {
  const pool = getDatabase();
  const kid = await requireConnectedKid(pool, user);
  const [profileResult, activity] = await Promise.all([
    pool.query(
      `SELECT
        id,
        name,
        avatar,
        photo_url,
        age,
        date_of_birth,
        preferred_language,
        interests
      FROM kids_profiles
      WHERE id = $1`,
      [kid.id]
    ),
    loadKidActivitySnapshot(pool, kid.id)
  ]);
  if (!profileResult.rows[0]) throw httpError(404, 'Kid profile not found', 'KID_NOT_FOUND');
  return {
    kid: profileResult.rows[0],
    ...activity
  };
}

export async function recordKidReadingProgress({
  user,
  kidProfileId,
  bookId,
  currentPage,
  totalPages,
  durationSeconds,
  completed,
  clientSessionId
}) {
  const pool = getDatabase();
  const safeCurrentPage = Math.max(0, Number.parseInt(currentPage, 10) || 0);
  const safeTotalPages = Math.max(0, Number.parseInt(totalPages, 10) || 0);
  const safeDuration = Math.max(0, Number.parseInt(durationSeconds, 10) || 0);
  const isCompleted = completed === true || completed === 'true';
  const progressPercent = safeTotalPages > 0
    ? Math.min(100, Math.round(((safeCurrentPage + 1) / safeTotalPages) * 100))
    : 0;

  const bookCheck = await pool.query(
    `SELECT b.*, c.name AS category_name
     FROM books b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.id = $1 AND b.is_published = TRUE`,
    [bookId]
  );
  if (bookCheck.rows.length === 0) throw httpError(404, 'Book not found', 'BOOK_NOT_FOUND');

  if (user) {
    const policy = await loadChildAccessPolicy({ user, pool });
    const violation = getContentAccessViolation(policy, bookCheck.rows[0]);
    if (violation) throw violation;
  }

  const progressResult = await pool.query(
    `INSERT INTO kid_reading_progress (
      kid_profile_id,
      book_id,
      current_page,
      total_pages,
      progress_percent,
      completed,
      last_read_at,
      completed_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), CASE WHEN $6 THEN NOW() ELSE NULL END, NOW())
    ON CONFLICT (kid_profile_id, book_id)
    DO UPDATE SET
      current_page = GREATEST(kid_reading_progress.current_page, EXCLUDED.current_page),
      total_pages = EXCLUDED.total_pages,
      progress_percent = GREATEST(kid_reading_progress.progress_percent, EXCLUDED.progress_percent),
      completed = kid_reading_progress.completed OR EXCLUDED.completed,
      last_read_at = NOW(),
      completed_at = CASE
        WHEN kid_reading_progress.completed_at IS NOT NULL THEN kid_reading_progress.completed_at
        WHEN EXCLUDED.completed THEN NOW()
        ELSE NULL
      END,
      updated_at = NOW()
    RETURNING *`,
    [kidProfileId, bookId, safeCurrentPage, safeTotalPages, progressPercent, isCompleted]
  );

  if (safeDuration > 0) {
    await pool.query(
      `INSERT INTO kid_reading_sessions (
        kid_profile_id,
        book_id,
        duration_seconds,
        page_reached,
        completed,
        client_session_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (kid_profile_id, client_session_id)
        WHERE client_session_id IS NOT NULL
      DO NOTHING`,
      [kidProfileId, bookId, safeDuration, safeCurrentPage, isCompleted, clientSessionId]
    );
  }

  await invalidateParentDashboardCache(kidProfileId);
  return progressResult.rows[0];
}

export async function upsertKidReadingGoal({ user, kidProfileId, goalType, targetValue, period }) {
  const pool = getDatabase();
  await assertKidActivityAccess(pool, user, kidProfileId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE kid_reading_goals SET active = FALSE, updated_at = NOW() WHERE kid_profile_id = $1 AND active = TRUE',
      [kidProfileId]
    );
    const result = await client.query(
      `INSERT INTO kid_reading_goals (kid_profile_id, goal_type, target_value, period, active, updated_at)
       VALUES ($1, $2, $3, $4, TRUE, NOW())
       RETURNING *`,
      [kidProfileId, goalType, targetValue, period]
    );
    await client.query('COMMIT');
    await invalidateParentDashboardCache(kidProfileId);
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function disableKidReadingGoal({ user, kidProfileId }) {
  const pool = getDatabase();
  await assertKidActivityAccess(pool, user, kidProfileId);
  await pool.query(
    'UPDATE kid_reading_goals SET active = FALSE, updated_at = NOW() WHERE kid_profile_id = $1 AND active = TRUE',
    [kidProfileId]
  );
  await invalidateParentDashboardCache(kidProfileId);
  return { message: 'Reading goal disabled' };
}

async function requireConnectedKid(pool, user) {
  if (user.role !== 'kid' || !user.kid_profile_id) {
    throw httpError(403, 'Kid account required', 'KID_ACCOUNT_REQUIRED');
  }
  const result = await pool.query(
    'SELECT id, parent_id FROM kids_profiles WHERE id = $1',
    [user.kid_profile_id]
  );
  if (!result.rows[0]) throw httpError(404, 'Kid profile not found', 'KID_NOT_FOUND');
  return result.rows[0];
}

export async function recordKidScreenTime({ user, clientSessionId, durationSeconds, startedAt }) {
  const pool = getDatabase();
  const kid = await requireConnectedKid(pool, user);
  const result = await pool.query(
    `INSERT INTO kid_screen_time_sessions (
       kid_profile_id, client_session_id, duration_seconds, started_at, last_heartbeat_at
     )
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (kid_profile_id, client_session_id)
     DO UPDATE SET duration_seconds = GREATEST(kid_screen_time_sessions.duration_seconds, EXCLUDED.duration_seconds),
                   started_at = LEAST(kid_screen_time_sessions.started_at, EXCLUDED.started_at),
                   last_heartbeat_at = NOW(),
                   updated_at = NOW()
     RETURNING id, duration_seconds, started_at, last_heartbeat_at`,
    [kid.id, clientSessionId, durationSeconds, startedAt]
  );
  await invalidateParentDashboardCache(kid.id);
  return result.rows[0];
}

export async function setKidBookFavorite({ user, bookId, favorite, favoritedAt = null }) {
  const pool = getDatabase();
  const kid = await requireConnectedKid(pool, user);
  if (favorite) {
    const result = await pool.query(
      `INSERT INTO kid_book_favorites (kid_profile_id, book_id, favorited_at)
       SELECT $1, b.id, COALESCE($3::timestamptz, NOW())
       FROM books b WHERE b.id = $2 AND b.is_published = TRUE
       ON CONFLICT (kid_profile_id, book_id)
       DO UPDATE SET favorited_at = EXCLUDED.favorited_at
       RETURNING book_id, favorited_at`,
      [kid.id, bookId, favoritedAt]
    );
    if (!result.rows[0]) throw httpError(404, 'Book not found', 'BOOK_NOT_FOUND');
  } else {
    await pool.query(
      'DELETE FROM kid_book_favorites WHERE kid_profile_id = $1 AND book_id = $2',
      [kid.id, bookId]
    );
  }
  await invalidateParentDashboardCache(kid.id);
  return { book_id: bookId, favorite };
}

export async function recordKidBookHistory({
  user,
  bookId,
  lastPage = 0,
  listenedSeconds = 0,
  audioDurationSeconds = 0,
  completed = false,
  occurredAt = null
}) {
  const pool = getDatabase();
  const kid = await requireConnectedKid(pool, user);
  const result = await pool.query(
    `INSERT INTO kid_book_history (
       kid_profile_id, book_id, last_page, listened_seconds,
       audio_duration_seconds, completed, last_opened_at, last_listened_at
     )
     SELECT $1, b.id, $3, $4, $5, $6,
            COALESCE($7::timestamptz, NOW()),
            CASE WHEN $4 > 0 THEN COALESCE($7::timestamptz, NOW()) ELSE NULL END
     FROM books b WHERE b.id = $2 AND b.is_published = TRUE
     ON CONFLICT (kid_profile_id, book_id)
     DO UPDATE SET last_page = GREATEST(kid_book_history.last_page, EXCLUDED.last_page),
                   listened_seconds = GREATEST(kid_book_history.listened_seconds, EXCLUDED.listened_seconds),
                   audio_duration_seconds = GREATEST(kid_book_history.audio_duration_seconds, EXCLUDED.audio_duration_seconds),
                   completed = kid_book_history.completed OR EXCLUDED.completed,
                   last_opened_at = GREATEST(kid_book_history.last_opened_at, EXCLUDED.last_opened_at),
                   last_listened_at = CASE
                     WHEN EXCLUDED.last_listened_at IS NULL THEN kid_book_history.last_listened_at
                     ELSE GREATEST(COALESCE(kid_book_history.last_listened_at, EXCLUDED.last_listened_at), EXCLUDED.last_listened_at)
                   END,
                   updated_at = NOW()
     RETURNING book_id, last_page, listened_seconds, completed, last_opened_at`,
    [kid.id, bookId, lastPage, listenedSeconds, audioDurationSeconds, completed, occurredAt]
  );
  if (!result.rows[0]) throw httpError(404, 'Book not found', 'BOOK_NOT_FOUND');
  await invalidateParentDashboardCache(kid.id);
  return result.rows[0];
}

export async function importKidLocalActivity({
  user,
  importKey,
  favorites = [],
  history = [],
  listeningHistory = []
}) {
  const pool = getDatabase();
  const kid = await requireConnectedKid(pool, user);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const marker = await client.query(
      `INSERT INTO kid_data_imports (kid_profile_id, import_key)
       VALUES ($1, $2)
       ON CONFLICT (kid_profile_id, import_key) DO NOTHING
       RETURNING id`,
      [kid.id, importKey]
    );
    if (!marker.rows[0]) {
      await client.query('ROLLBACK');
      return { imported: false, reason: 'already_imported' };
    }

    const favoriteIds = [...new Set(favorites.map(Number).filter(Number.isInteger))].slice(0, 20);
    if (favoriteIds.length > 0) {
      await client.query(
        `INSERT INTO kid_book_favorites (kid_profile_id, book_id)
         SELECT $1, b.id FROM books b WHERE b.id = ANY($2::int[]) AND b.is_published = TRUE
         ON CONFLICT (kid_profile_id, book_id) DO NOTHING`,
        [kid.id, favoriteIds]
      );
    }

    const mergedHistory = new Map();
    for (const item of [...history, ...listeningHistory].slice(0, 100)) {
      const bookId = Number(item.bookId ?? item.book_id);
      if (!Number.isInteger(bookId) || bookId <= 0) continue;
      const current = mergedHistory.get(bookId) || {};
      mergedHistory.set(bookId, {
        bookId,
        lastPage: Math.max(Number(current.lastPage || 0), Number(item.page || 0)),
        listenedSeconds: Math.max(Number(current.listenedSeconds || 0), Number(item.listenedSeconds || 0)),
        audioDurationSeconds: Math.max(Number(current.audioDurationSeconds || 0), Number(item.duration || 0)),
        completed: Boolean(current.completed || item.completed),
        occurredAt: item.lastRead || item.listenedAt || current.occurredAt || new Date().toISOString()
      });
    }
    for (const item of [...mergedHistory.values()].slice(0, 50)) {
      await client.query(
        `INSERT INTO kid_book_history (
           kid_profile_id, book_id, last_page, listened_seconds,
           audio_duration_seconds, completed, last_opened_at, last_listened_at
         )
         SELECT $1, b.id, $3, $4, $5, $6, $7::timestamptz,
                CASE WHEN $4 > 0 THEN $7::timestamptz ELSE NULL END
         FROM books b WHERE b.id = $2 AND b.is_published = TRUE
         ON CONFLICT (kid_profile_id, book_id)
         DO UPDATE SET last_page = GREATEST(kid_book_history.last_page, EXCLUDED.last_page),
                       listened_seconds = GREATEST(kid_book_history.listened_seconds, EXCLUDED.listened_seconds),
                       audio_duration_seconds = GREATEST(kid_book_history.audio_duration_seconds, EXCLUDED.audio_duration_seconds),
                       completed = kid_book_history.completed OR EXCLUDED.completed,
                       last_opened_at = GREATEST(kid_book_history.last_opened_at, EXCLUDED.last_opened_at),
                       last_listened_at = CASE
                         WHEN EXCLUDED.last_listened_at IS NULL THEN kid_book_history.last_listened_at
                         ELSE GREATEST(
                           COALESCE(kid_book_history.last_listened_at, EXCLUDED.last_listened_at),
                           EXCLUDED.last_listened_at
                         )
                       END,
                       updated_at = NOW()`,
        [
          kid.id,
          item.bookId,
          Math.max(0, Math.floor(item.lastPage)),
          Math.max(0, Math.floor(item.listenedSeconds)),
          Math.max(0, Math.floor(item.audioDurationSeconds)),
          item.completed,
          item.occurredAt
        ]
      );
    }
    await client.query('COMMIT');
    await invalidateParentDashboardCache(kid.id);
    return {
      imported: true,
      favorites: favoriteIds.length,
      history: mergedHistory.size
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
