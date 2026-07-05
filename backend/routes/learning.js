import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = express.Router();

const allowedContentTypes = new Set(['quiz', 'game', 'challenge', 'alphabet', 'numbers', 'colors', 'shapes', 'languages']);
const allowedQuizTypes = new Set(['multiple_choice', 'image_word_match', 'listen_answer', 'find_image', 'true_false', 'sequence_order']);
const allowedDifficulties = new Set(['easy', 'medium', 'hard']);

function getPool() {
  return getDatabase();
}

function mapContent(row, questions = []) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    content_type: row.content_type,
    quiz_type: row.quiz_type,
    category_id: row.category_id,
    category_name: row.category_name || '',
    category_code: row.category_code || '',
    category_pictogram: row.category_pictogram || row.metadata?.pictogram || '⭐',
    category_color: row.category_color || 'from-sky-500 to-cyan-400',
    age_group_min: Number(row.age_group_min || 2),
    age_group_max: Number(row.age_group_max || 10),
    language: row.language || 'fr',
    difficulty: row.difficulty || 'easy',
    image_url: row.image_url || '',
    audio_url: row.audio_url || '',
    reward: row.reward_id ? {
      id: row.reward_id,
      name: row.reward_name,
      reward_type: row.reward_type,
      icon: row.reward_icon,
      value: Number(row.reward_value || 0),
    } : null,
    status: row.status,
    metadata: row.metadata || {},
    ai_generation_ready: row.ai_generation_ready !== false,
    questions,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapQuestion(row, includeAnswer = false) {
  return {
    id: row.id,
    content_id: row.content_id,
    question_type: row.question_type,
    prompt: row.prompt,
    image_url: row.image_url || '',
    audio_url: row.audio_url || '',
    options: row.options || [],
    ...(includeAnswer ? { correct_answer: row.correct_answer || {} } : {}),
    explanation: row.explanation || '',
    position: Number(row.position || 0),
  };
}

function normalizeContentPayload(body) {
  const contentType = String(body.content_type || 'quiz').trim();
  const quizType = body.quiz_type ? String(body.quiz_type).trim() : null;
  const difficulty = String(body.difficulty || 'easy').trim();

  if (!String(body.title || '').trim()) throw new Error('Title is required');
  if (!allowedContentTypes.has(contentType)) throw new Error('Unsupported content type');
  if (quizType && !allowedQuizTypes.has(quizType)) throw new Error('Unsupported quiz type');
  if (!allowedDifficulties.has(difficulty)) throw new Error('Unsupported difficulty');

  return {
    title: String(body.title).trim().slice(0, 180),
    description: String(body.description || '').trim().slice(0, 800),
    content_type: contentType,
    quiz_type: quizType,
    category_id: body.category_id ? Number(body.category_id) : null,
    age_group_min: Math.max(2, Number.parseInt(body.age_group_min || '2', 10) || 2),
    age_group_max: Math.min(12, Number.parseInt(body.age_group_max || '10', 10) || 10),
    language: String(body.language || 'fr').trim().slice(0, 12),
    difficulty,
    image_url: String(body.image_url || '').trim(),
    audio_url: String(body.audio_url || '').trim(),
    reward_id: body.reward_id ? Number(body.reward_id) : null,
    status: body.status === 'published' ? 'published' : 'draft',
    metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
  };
}

function normalizeQuestionPayload(question, index) {
  const questionType = String(question.question_type || 'multiple_choice').trim();
  if (!allowedQuizTypes.has(questionType)) throw new Error('Unsupported question type');
  if (!String(question.prompt || '').trim()) throw new Error('Question prompt is required');

  return {
    question_type: questionType,
    prompt: String(question.prompt).trim().slice(0, 300),
    image_url: String(question.image_url || '').trim(),
    audio_url: String(question.audio_url || '').trim(),
    options: Array.isArray(question.options) ? question.options : [],
    correct_answer: question.correct_answer && typeof question.correct_answer === 'object' ? question.correct_answer : {},
    explanation: String(question.explanation || '').trim().slice(0, 500),
    position: Number.parseInt(question.position ?? index + 1, 10) || index + 1,
  };
}

async function getKidProfileForRequest(pool, req, requestedKidProfileId = null) {
  if (req.user.role === 'kid' && req.user.kid_profile_id) {
    const result = await pool.query('SELECT * FROM kids_profiles WHERE id = $1', [req.user.kid_profile_id]);
    return result.rows[0] || null;
  }

  if (['parent', 'admin'].includes(req.user.role) && requestedKidProfileId) {
    const query = req.user.role === 'admin'
      ? 'SELECT * FROM kids_profiles WHERE id = $1'
      : 'SELECT * FROM kids_profiles WHERE id = $1 AND parent_id = $2';
    const params = req.user.role === 'admin' ? [requestedKidProfileId] : [requestedKidProfileId, req.user.id];
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  return null;
}

async function loadContent(pool, contentId, { includeDraft = false, includeAnswers = false } = {}) {
  const contentResult = await pool.query(
    `SELECT lc.*, cat.name AS category_name, cat.code AS category_code,
            cat.pictogram AS category_pictogram, cat.color AS category_color,
            lr.name AS reward_name, lr.reward_type, lr.icon AS reward_icon, lr.value AS reward_value
     FROM learning_contents lc
     LEFT JOIN learning_categories cat ON cat.id = lc.category_id
     LEFT JOIN learning_rewards lr ON lr.id = lc.reward_id
     WHERE lc.id = $1 AND ($2 = TRUE OR lc.status = 'published')`,
    [contentId, includeDraft]
  );
  const content = contentResult.rows[0];
  if (!content) return null;

  const questionResult = await pool.query(
    `SELECT * FROM learning_questions WHERE content_id = $1 ORDER BY position ASC, id ASC`,
    [contentId]
  );

  return mapContent(content, questionResult.rows.map((row) => mapQuestion(row, includeAnswers)));
}

function answerValue(answer) {
  if (answer == null) return null;
  if (typeof answer === 'object' && 'value' in answer) return answer.value;
  return answer;
}

function scoreAnswers(questions, answers = []) {
  const answersByQuestion = new Map(
    answers.map((answer) => [Number(answer.question_id), answerValue(answer.answer)])
  );
  let score = 0;

  const evaluatedAnswers = questions.map((question) => {
    const expected = answerValue(question.correct_answer);
    const received = answersByQuestion.get(Number(question.id));
    const correct = JSON.stringify(expected) === JSON.stringify(received);
    if (correct) score += 1;

    return {
      question_id: question.id,
      answer: received,
      correct,
      expected,
    };
  });

  return {
    score,
    maxScore: questions.length,
    success: questions.length > 0 && score >= Math.ceil(questions.length * 0.7),
    evaluatedAnswers,
  };
}

async function updateChallengeProgress(pool, kidProfileId, attempt, content) {
  const challengeResult = await pool.query(
    `SELECT ch.*, lr.icon AS reward_icon, lr.name AS reward_name
     FROM learning_challenges ch
     LEFT JOIN learning_rewards lr ON lr.id = ch.reward_id
     WHERE ch.status = 'active'`
  );

  const completed = [];
  for (const challenge of challengeResult.rows) {
    let increment = 0;
    if (challenge.challenge_type === 'quiz_success_count' && attempt.success) increment = 1;
    if (challenge.challenge_type === 'category_success_count' && attempt.success && challenge.category_id === content.category_id) increment = 1;
    if (challenge.challenge_type === 'learning_complete' && attempt.success) increment = 1;
    if (!increment) continue;

    const progressResult = await pool.query(
      `WITH updated AS (
         UPDATE kid_challenge_progress
         SET
           progress_value = LEAST(progress_value + $3, $4),
           completed = completed OR (progress_value + $3 >= $4),
           completed_at = CASE
             WHEN completed_at IS NULL AND progress_value + $3 >= $4 THEN NOW()
             ELSE completed_at
           END,
           updated_at = NOW()
         WHERE kid_profile_id = $1 AND challenge_id = $2
         RETURNING *
       ),
       inserted AS (
         INSERT INTO kid_challenge_progress (kid_profile_id, challenge_id, progress_value, completed, completed_at, updated_at)
         SELECT $1, $2, LEAST($3, $4), $3 >= $4, CASE WHEN $3 >= $4 THEN NOW() ELSE NULL END, NOW()
         WHERE NOT EXISTS (SELECT 1 FROM updated)
         RETURNING *
       )
       SELECT * FROM updated
       UNION ALL
       SELECT * FROM inserted
       LIMIT 1`,
      [kidProfileId, challenge.id, increment, Number(challenge.target_value)]
    );

    const progress = progressResult.rows[0];
    if (progress.completed && progress.progress_value >= Number(challenge.target_value)) {
      completed.push({
        id: challenge.id,
        title: challenge.title,
        reward_icon: challenge.reward_icon,
        reward_name: challenge.reward_name,
      });
    }
  }

  return completed;
}

async function syncDerivedChallengeProgress(pool, kidProfileId) {
  const listeningResult = await pool.query(
    'SELECT COUNT(*)::int AS count FROM kid_reading_sessions WHERE kid_profile_id = $1',
    [kidProfileId]
  );
  const listeningCount = Number(listeningResult.rows[0]?.count || 0);

  const challenges = await pool.query(
    `SELECT * FROM learning_challenges
     WHERE status = 'active' AND challenge_type = 'listening_count'`
  );

  for (const challenge of challenges.rows) {
    const progressValue = Math.min(listeningCount, Number(challenge.target_value || 1));
    await pool.query(
      `WITH updated AS (
         UPDATE kid_challenge_progress
         SET
           progress_value = GREATEST(progress_value, $3),
           completed = completed OR $4,
           completed_at = CASE
             WHEN completed_at IS NULL AND $4 THEN NOW()
             ELSE completed_at
           END,
           updated_at = NOW()
         WHERE kid_profile_id = $1 AND challenge_id = $2
         RETURNING *
       )
       INSERT INTO kid_challenge_progress (kid_profile_id, challenge_id, progress_value, completed, completed_at, updated_at)
       SELECT $1, $2, $3, $4, CASE WHEN $4 THEN NOW() ELSE NULL END, NOW()
       WHERE NOT EXISTS (SELECT 1 FROM updated)`,
      [kidProfileId, challenge.id, progressValue, progressValue >= Number(challenge.target_value || 1)]
    );
  }
}

router.get('/categories', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM learning_categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error loading learning categories:', error);
    res.status(500).json({ error: 'Could not load learning categories' });
  }
});

router.get('/rewards', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM learning_rewards ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error loading learning rewards:', error);
    res.status(500).json({ error: 'Could not load rewards' });
  }
});

router.get('/contents', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const includeDraft = req.user.role === 'admin' && req.query.include_draft === 'true';
    const params = [];
    const where = [includeDraft ? 'TRUE' : "lc.status = 'published'"];

    if (req.query.content_type) {
      params.push(req.query.content_type);
      where.push(`lc.content_type = $${params.length}`);
    }
    if (req.query.category_id) {
      params.push(req.query.category_id);
      where.push(`lc.category_id = $${params.length}`);
    }
    if (req.query.language) {
      params.push(req.query.language);
      where.push(`lc.language = $${params.length}`);
    }

    const result = await pool.query(
      `SELECT lc.*, cat.name AS category_name, cat.code AS category_code,
              cat.pictogram AS category_pictogram, cat.color AS category_color,
              lr.name AS reward_name, lr.reward_type, lr.icon AS reward_icon, lr.value AS reward_value
       FROM learning_contents lc
       LEFT JOIN learning_categories cat ON cat.id = lc.category_id
       LEFT JOIN learning_rewards lr ON lr.id = lc.reward_id
       WHERE ${where.join(' AND ')}
       ORDER BY lc.status DESC, lc.created_at DESC`,
      params
    );

    res.json(result.rows.map((row) => mapContent(row)));
  } catch (error) {
    console.error('Error loading learning contents:', error);
    res.status(500).json({ error: 'Could not load learning contents' });
  }
});

router.get('/contents/:id', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const content = await loadContent(pool, req.params.id, {
      includeDraft: req.user.role === 'admin',
      includeAnswers: req.user.role === 'admin',
    });
    if (!content) return res.status(404).json({ error: 'Learning content not found' });
    res.json(content);
  } catch (error) {
    console.error('Error loading learning content:', error);
    res.status(500).json({ error: 'Could not load learning content' });
  }
});

router.post('/contents/:id/attempts', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const kidProfile = await getKidProfileForRequest(pool, req, req.body.kid_profile_id);
    if (!kidProfile) return res.status(403).json({ error: 'Kid profile required' });

    const content = await loadContent(pool, req.params.id, { includeDraft: false, includeAnswers: true });
    if (!content) return res.status(404).json({ error: 'Learning content not found' });

    const scoring = scoreAnswers(content.questions, Array.isArray(req.body.answers) ? req.body.answers : []);
    const rewardPayload = scoring.success && content.reward ? {
      icon: content.reward.icon,
      name: content.reward.name,
      type: content.reward.reward_type,
      value: content.reward.value,
    } : {};

    const attemptResult = await pool.query(
      `INSERT INTO learning_attempts (
        kid_profile_id, content_id, score, max_score, success, time_spent_seconds, answers, reward_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
      RETURNING *`,
      [
        kidProfile.id,
        content.id,
        scoring.score,
        scoring.maxScore,
        scoring.success,
        Math.max(0, Number.parseInt(req.body.time_spent_seconds || '0', 10) || 0),
        JSON.stringify(scoring.evaluatedAnswers),
        JSON.stringify(rewardPayload),
      ]
    );

    let reward = rewardPayload;
    if (scoring.success && content.reward?.id) {
      try {
        await pool.query(
          `INSERT INTO kid_rewards (kid_profile_id, reward_id, source_type, source_id, payload)
           VALUES ($1, $2, 'learning_attempt', $3, $4::jsonb)`,
          [kidProfile.id, content.reward.id, attemptResult.rows[0].id, JSON.stringify(rewardPayload)]
        );
      } catch (rewardError) {
        console.warn('Learning reward could not be saved:', rewardError.message);
        reward = { ...rewardPayload, save_warning: true };
      }
    }

    let completedChallenges = [];
    try {
      completedChallenges = await updateChallengeProgress(pool, kidProfile.id, attemptResult.rows[0], content);
    } catch (challengeError) {
      console.warn('Learning challenge progress could not be updated:', challengeError.message);
    }

    res.status(201).json({
      attempt: attemptResult.rows[0],
      reward,
      completed_challenges: completedChallenges,
    });
  } catch (error) {
    console.error('Error saving learning attempt:', error);
    res.status(500).json({ error: 'Could not save learning attempt' });
  }
});

router.get('/challenges', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const kidProfile = await getKidProfileForRequest(pool, req, req.query.kid_profile_id);
    if (kidProfile) await syncDerivedChallengeProgress(pool, kidProfile.id);
    const params = kidProfile ? [kidProfile.id] : [null];
    const result = await pool.query(
      `SELECT ch.*, cat.pictogram AS category_pictogram, lr.icon AS reward_icon, lr.name AS reward_name,
              COALESCE(kcp.progress_value, 0) AS progress_value,
              COALESCE(kcp.completed, FALSE) AS completed
       FROM learning_challenges ch
       LEFT JOIN learning_categories cat ON cat.id = ch.category_id
       LEFT JOIN learning_rewards lr ON lr.id = ch.reward_id
       LEFT JOIN kid_challenge_progress kcp ON kcp.challenge_id = ch.id AND kcp.kid_profile_id = $1
       WHERE ch.status = 'active'
       ORDER BY ch.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error loading challenges:', error);
    res.status(500).json({ error: 'Could not load challenges' });
  }
});

router.get('/parent/kids/:kidId/summary', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const kidProfile = await getKidProfileForRequest(pool, req, req.params.kidId);
    if (!kidProfile) return res.status(403).json({ error: 'Kid profile access denied' });
    await syncDerivedChallengeProgress(pool, kidProfile.id);

    const [summary, recent, challenges, rewards] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS attempts,
                COALESCE(SUM(time_spent_seconds), 0)::int AS time_spent_seconds,
                COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END), 0)::int AS successes,
                COALESCE(ROUND(AVG(CASE WHEN max_score > 0 THEN score::numeric / max_score * 100 ELSE 0 END)), 0)::int AS average_score
         FROM learning_attempts
         WHERE kid_profile_id = $1`,
        [kidProfile.id]
      ),
      pool.query(
        `SELECT la.*, lc.title, lc.content_type, cat.pictogram AS category_pictogram
         FROM learning_attempts la
         JOIN learning_contents lc ON lc.id = la.content_id
         LEFT JOIN learning_categories cat ON cat.id = lc.category_id
         WHERE la.kid_profile_id = $1
         ORDER BY la.created_at DESC
         LIMIT 8`,
        [kidProfile.id]
      ),
      pool.query(
        `SELECT kcp.*, ch.title, ch.target_value, lr.icon AS reward_icon
         FROM kid_challenge_progress kcp
         JOIN learning_challenges ch ON ch.id = kcp.challenge_id
         LEFT JOIN learning_rewards lr ON lr.id = ch.reward_id
         WHERE kcp.kid_profile_id = $1
         ORDER BY kcp.updated_at DESC
         LIMIT 8`,
        [kidProfile.id]
      ),
      pool.query(
        `SELECT kr.*, lr.name, lr.icon, lr.reward_type, lr.value
         FROM kid_rewards kr
         LEFT JOIN learning_rewards lr ON lr.id = kr.reward_id
         WHERE kr.kid_profile_id = $1
         ORDER BY kr.created_at DESC
         LIMIT 12`,
        [kidProfile.id]
      )
    ]);

    res.json({
      kid: kidProfile,
      summary: summary.rows[0],
      recent_attempts: recent.rows,
      challenges: challenges.rows,
      rewards: rewards.rows,
    });
  } catch (error) {
    console.error('Error loading learning parent summary:', error);
    res.status(500).json({ error: 'Could not load learning summary' });
  }
});

router.use('/admin', verifyToken, adminOnly);

router.post('/admin/contents', async (req, res) => {
  try {
    const pool = getPool();
    const payload = normalizeContentPayload(req.body);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const contentResult = await client.query(
        `INSERT INTO learning_contents (
          title, description, content_type, quiz_type, category_id, age_group_min, age_group_max,
          language, difficulty, image_url, audio_url, reward_id, status, metadata
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING *`,
        [
          payload.title, payload.description, payload.content_type, payload.quiz_type, payload.category_id,
          payload.age_group_min, payload.age_group_max, payload.language, payload.difficulty,
          payload.image_url, payload.audio_url, payload.reward_id, payload.status, payload.metadata,
        ]
      );

      const questions = Array.isArray(req.body.questions) ? req.body.questions : [];
      for (let index = 0; index < questions.length; index += 1) {
        const question = normalizeQuestionPayload(questions[index], index);
        await client.query(
          `INSERT INTO learning_questions (content_id, question_type, prompt, image_url, audio_url, options, correct_answer, explanation, position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            contentResult.rows[0].id, question.question_type, question.prompt, question.image_url, question.audio_url,
            question.options, question.correct_answer, question.explanation, question.position,
          ]
        );
      }
      await client.query('COMMIT');
      const content = await loadContent(pool, contentResult.rows[0].id, { includeDraft: true, includeAnswers: true });
      res.status(201).json(content);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating learning content:', error);
    res.status(400).json({ error: error.message || 'Could not create learning content' });
  }
});

router.put('/admin/contents/:id', async (req, res) => {
  try {
    const pool = getPool();
    const payload = normalizeContentPayload(req.body);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `UPDATE learning_contents
         SET title=$1, description=$2, content_type=$3, quiz_type=$4, category_id=$5,
             age_group_min=$6, age_group_max=$7, language=$8, difficulty=$9,
             image_url=$10, audio_url=$11, reward_id=$12, status=$13, metadata=$14, updated_at=NOW()
         WHERE id=$15
         RETURNING *`,
        [
          payload.title, payload.description, payload.content_type, payload.quiz_type, payload.category_id,
          payload.age_group_min, payload.age_group_max, payload.language, payload.difficulty,
          payload.image_url, payload.audio_url, payload.reward_id, payload.status, payload.metadata, req.params.id,
        ]
      );
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Learning content not found' });
      }

      if (Array.isArray(req.body.questions)) {
        await client.query('DELETE FROM learning_questions WHERE content_id = $1', [req.params.id]);
        for (let index = 0; index < req.body.questions.length; index += 1) {
          const question = normalizeQuestionPayload(req.body.questions[index], index);
          await client.query(
            `INSERT INTO learning_questions (content_id, question_type, prompt, image_url, audio_url, options, correct_answer, explanation, position)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              req.params.id, question.question_type, question.prompt, question.image_url, question.audio_url,
              question.options, question.correct_answer, question.explanation, question.position,
            ]
          );
        }
      }
      await client.query('COMMIT');
      const content = await loadContent(pool, req.params.id, { includeDraft: true, includeAnswers: true });
      res.json(content);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating learning content:', error);
    res.status(400).json({ error: error.message || 'Could not update learning content' });
  }
});

router.delete('/admin/contents/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query('DELETE FROM learning_contents WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Learning content not found' });
    res.json({ message: 'Learning content deleted' });
  } catch (error) {
    console.error('Error deleting learning content:', error);
    res.status(500).json({ error: 'Could not delete learning content' });
  }
});

router.post('/admin/challenges', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO learning_challenges (title, description, challenge_type, target_value, category_id, reward_id, status, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        String(req.body.title || '').trim(),
        String(req.body.description || '').trim(),
        String(req.body.challenge_type || 'quiz_success_count'),
        Math.max(1, Number.parseInt(req.body.target_value || '1', 10) || 1),
        req.body.category_id || null,
        req.body.reward_id || null,
        req.body.status === 'draft' ? 'draft' : 'active',
        req.body.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {},
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(400).json({ error: 'Could not create challenge' });
  }
});

router.post('/admin/rewards', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO learning_rewards (code, name, reward_type, icon, value, description)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        String(req.body.code || '').trim(),
        String(req.body.name || '').trim(),
        String(req.body.reward_type || 'stars'),
        String(req.body.icon || '⭐').trim(),
        Math.max(1, Number.parseInt(req.body.value || '1', 10) || 1),
        String(req.body.description || '').trim(),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating reward:', error);
    res.status(400).json({ error: 'Could not create reward' });
  }
});

router.post('/admin/categories', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO learning_categories (code, name, description, pictogram, color)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        String(req.body.code || '').trim(),
        String(req.body.name || '').trim(),
        String(req.body.description || '').trim(),
        String(req.body.pictogram || '⭐').trim(),
        String(req.body.color || 'from-sky-500 to-cyan-400').trim(),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating learning category:', error);
    res.status(400).json({ error: 'Could not create category' });
  }
});

export default router;
