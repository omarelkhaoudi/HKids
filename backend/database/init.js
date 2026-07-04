import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Vérifie et parse DATABASE_URL
function parseDatabaseUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      connectionString: url,
      isValid: parsed.protocol.startsWith('postgres'),
      user: parsed.username,
      password: parsed.password || '',
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
      database: parsed.pathname.slice(1) || 'hkids',
    };
  } catch (e) {
    return null;
  }
}

// Configuration PostgreSQL
const dbUrl = parseDatabaseUrl(process.env.DATABASE_URL);
const poolConfig = dbUrl && dbUrl.isValid
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // ✅ obligatoire Render
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hkids',
      ssl: { rejectUnauthorized: false }
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err);
});

export function getDatabase() {
  if (!pool) throw new Error('PostgreSQL pool not initialized.');
  return pool;
}

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔍 Initialisation de la base...');

    await client.query('BEGIN');

    // Tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT,
        author TEXT,
        description TEXT,
        cover_image TEXT,
        file_path TEXT NOT NULL,
        content_type TEXT NOT NULL DEFAULT 'story',
        language TEXT NOT NULL DEFAULT 'fr',
        theme TEXT,
        subcategory_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        tags TEXT[] DEFAULT '{}',
        audio_url TEXT,
        duration_seconds INTEGER DEFAULT 0,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        age_group_min INTEGER DEFAULT 0,
        age_group_max INTEGER DEFAULT 12,
        page_count INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT FALSE,
        is_premium BOOLEAN DEFAULT FALSE,
        is_recommended BOOLEAN DEFAULT FALSE,
        is_popular BOOLEAN DEFAULT FALSE,
        is_new BOOLEAN DEFAULT FALSE,
        publish_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS book_pages (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        page_number INTEGER NOT NULL,
        image_path TEXT,
        content TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS kids_profiles (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        avatar TEXT,
        age INTEGER,
        date_of_birth DATE,
        photo_url TEXT,
        preferred_language TEXT NOT NULL DEFAULT 'fr',
        interests TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS parent_approvals (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(kid_profile_id, category_id)
      );`,
      `CREATE TABLE IF NOT EXISTS parental_rules (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        daily_screen_time_minutes INTEGER NOT NULL DEFAULT 30,
        quiet_start_time TIME,
        quiet_end_time TIME,
        allowed_languages TEXT[] DEFAULT '{}',
        allowed_themes TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(kid_profile_id)
      );`,
      `CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        monthly_price_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        book_limit INTEGER NOT NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        status TEXT NOT NULL DEFAULT 'active',
        started_at TIMESTAMPTZ DEFAULT NOW(),
        current_period_start TIMESTAMPTZ DEFAULT NOW(),
        current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        provider TEXT,
        provider_subscription_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS subscription_book_unlocks (
        id SERIAL PRIMARY KEY,
        subscription_id INTEGER NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        period_start TIMESTAMPTZ NOT NULL,
        period_end TIMESTAMPTZ NOT NULL,
        unlocked_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(subscription_id, book_id, period_start)
      );`,
      `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        confirmation_token TEXT UNIQUE NOT NULL,
        confirmed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS kid_reading_progress (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        current_page INTEGER NOT NULL DEFAULT 0,
        total_pages INTEGER NOT NULL DEFAULT 0,
        progress_percent INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        last_read_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(kid_profile_id, book_id)
      );`,
      `CREATE TABLE IF NOT EXISTS kid_reading_sessions (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        page_reached INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS kid_reading_goals (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        goal_type TEXT NOT NULL DEFAULT 'minutes',
        target_value INTEGER NOT NULL DEFAULT 10,
        period TEXT NOT NULL DEFAULT 'weekly',
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS generated_stories (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        story_text TEXT NOT NULL,
        summary TEXT,
        language TEXT NOT NULL DEFAULT 'fr',
        theme TEXT,
        age_level TEXT,
        characters TEXT[] DEFAULT '{}',
        estimated_duration_minutes INTEGER NOT NULL DEFAULT 5,
        educational_value TEXT,
        age_at_generation INTEGER,
        prompt_metadata JSONB DEFAULT '{}'::jsonb,
        generation_metadata JSONB DEFAULT '{}'::jsonb,
        chapters JSONB DEFAULT '[]'::jsonb,
        interactive_choices JSONB DEFAULT '[]'::jsonb,
        illustration_plan JSONB DEFAULT '{}'::jsonb,
        narration_metadata JSONB DEFAULT '{}'::jsonb,
        provider TEXT NOT NULL DEFAULT 'mock',
        saved BOOLEAN DEFAULT FALSE,
        saved_at TIMESTAMPTZ,
        favorite BOOLEAN DEFAULT FALSE,
        favorited_at TIMESTAMPTZ,
        source_story_id INTEGER REFERENCES generated_stories(id) ON DELETE SET NULL,
        version_number INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS voice_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        relation TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'fr',
        status TEXT NOT NULL DEFAULT 'draft',
        provider TEXT NOT NULL DEFAULT 'mock',
        provider_voice_id TEXT,
        sample_audio_path TEXT,
        preview_audio_path TEXT,
        consent_given BOOLEAN NOT NULL DEFAULT FALSE,
        consent_at TIMESTAMPTZ,
        quality_score INTEGER NOT NULL DEFAULT 0,
        quality_status TEXT NOT NULL DEFAULT 'pending',
        quality_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );`,
      `CREATE TABLE IF NOT EXISTS voice_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        voice_profile_id INTEGER REFERENCES voice_profiles(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        message_text TEXT,
        language TEXT NOT NULL DEFAULT 'fr',
        audio_path TEXT,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );`,
      `CREATE TABLE IF NOT EXISTS voice_audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        voice_profile_id INTEGER REFERENCES voice_profiles(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS voice_narrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        voice_profile_id INTEGER REFERENCES voice_profiles(id) ON DELETE CASCADE,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        provider TEXT NOT NULL DEFAULT 'mock',
        provider_voice_id TEXT,
        text_hash TEXT NOT NULL,
        audio_path TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(voice_profile_id, book_id, text_hash)
      );`,
      `CREATE TABLE IF NOT EXISTS learning_categories (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        pictogram TEXT,
        color TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS learning_contents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        content_type TEXT NOT NULL DEFAULT 'quiz',
        quiz_type TEXT,
        category_id INTEGER REFERENCES learning_categories(id) ON DELETE SET NULL,
        age_group_min INTEGER NOT NULL DEFAULT 2,
        age_group_max INTEGER NOT NULL DEFAULT 10,
        language TEXT NOT NULL DEFAULT 'fr',
        difficulty TEXT NOT NULL DEFAULT 'easy',
        image_url TEXT,
        audio_url TEXT,
        reward_id INTEGER,
        status TEXT NOT NULL DEFAULT 'draft',
        metadata JSONB DEFAULT '{}'::jsonb,
        ai_generation_ready BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS learning_questions (
        id SERIAL PRIMARY KEY,
        content_id INTEGER NOT NULL REFERENCES learning_contents(id) ON DELETE CASCADE,
        question_type TEXT NOT NULL DEFAULT 'multiple_choice',
        prompt TEXT NOT NULL,
        image_url TEXT,
        audio_url TEXT,
        options JSONB DEFAULT '[]'::jsonb,
        correct_answer JSONB DEFAULT '{}'::jsonb,
        explanation TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS learning_rewards (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        reward_type TEXT NOT NULL DEFAULT 'stars',
        icon TEXT NOT NULL DEFAULT '⭐',
        value INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS learning_attempts (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        content_id INTEGER NOT NULL REFERENCES learning_contents(id) ON DELETE CASCADE,
        score INTEGER NOT NULL DEFAULT 0,
        max_score INTEGER NOT NULL DEFAULT 0,
        success BOOLEAN NOT NULL DEFAULT FALSE,
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        answers JSONB DEFAULT '[]'::jsonb,
        reward_payload JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS learning_challenges (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        challenge_type TEXT NOT NULL DEFAULT 'quiz_count',
        target_value INTEGER NOT NULL DEFAULT 1,
        category_id INTEGER REFERENCES learning_categories(id) ON DELETE SET NULL,
        reward_id INTEGER REFERENCES learning_rewards(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'active',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS kid_challenge_progress (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        challenge_id INTEGER NOT NULL REFERENCES learning_challenges(id) ON DELETE CASCADE,
        progress_value INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(kid_profile_id, challenge_id)
      );`,
      `CREATE TABLE IF NOT EXISTS kid_rewards (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        reward_id INTEGER REFERENCES learning_rewards(id) ON DELETE SET NULL,
        source_type TEXT NOT NULL,
        source_id INTEGER,
        payload JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`
    ];

    for (const tableQuery of tables) await client.query(tableQuery);

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS kid_profile_id INTEGER REFERENCES kids_profiles(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS slug TEXT`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'story'`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr'`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS theme TEXT`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS subcategory_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS audio_url TEXT`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS publish_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE kids_profiles ADD COLUMN IF NOT EXISTS photo_url TEXT`);
    await client.query(`ALTER TABLE kids_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE`);
    await client.query(`ALTER TABLE kids_profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'fr'`);
    await client.query(`ALTER TABLE kids_profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}'`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS daily_screen_time_minutes INTEGER NOT NULL DEFAULT 30`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS quiet_start_time TIME`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS quiet_end_time TIME`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS allowed_languages TEXT[] DEFAULT '{}'`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS allowed_themes TEXT[] DEFAULT '{}'`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Histoire personnalisee'`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS story_text TEXT NOT NULL DEFAULT ''`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS summary TEXT`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr'`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS theme TEXT`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS age_level TEXT`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS characters TEXT[] DEFAULT '{}'`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER NOT NULL DEFAULT 5`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS educational_value TEXT`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS age_at_generation INTEGER`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS prompt_metadata JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS interactive_choices JSONB DEFAULT '[]'::jsonb`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS illustration_plan JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS narration_metadata JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mock'`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS saved_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS favorited_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS source_story_id INTEGER REFERENCES generated_stories(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mock'`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS provider_voice_id TEXT`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS preview_audio_path TEXT`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS quality_score INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS quality_status TEXT NOT NULL DEFAULT 'pending'`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS quality_notes TEXT`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE voice_messages ADD COLUMN IF NOT EXISTS duration_seconds INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE voice_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE voice_narrations ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'mock'`);
    await client.query(`ALTER TABLE voice_narrations ADD COLUMN IF NOT EXISTS provider_voice_id TEXT`);
    await client.query(`ALTER TABLE voice_narrations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE voice_narrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE learning_contents ADD COLUMN IF NOT EXISTS reward_id INTEGER`);
    await client.query(`ALTER TABLE learning_contents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE learning_contents ADD COLUMN IF NOT EXISTS ai_generation_ready BOOLEAN DEFAULT TRUE`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS monthly_price_cents INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR'`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS book_limit INTEGER NOT NULL DEFAULT 1`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`);
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month')`);
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS provider TEXT`);
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT`);
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`
      UPDATE books
      SET slug = CONCAT(
        regexp_replace(
          regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'),
          '(^-|-$)', '', 'g'
        ),
        '-',
        id
      )
      WHERE slug IS NULL OR slug = ''
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS books_slug_unique ON books(slug)`);
    await client.query(`CREATE INDEX IF NOT EXISTS books_theme_language_idx ON books(theme, language, content_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS books_tags_idx ON books USING GIN(tags)`);
    await client.query(`CREATE INDEX IF NOT EXISTS books_cms_filters_idx ON books(is_published, is_premium, is_recommended, is_popular, is_new, publish_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories(parent_id)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS book_pages_book_page_unique ON book_pages(book_id, page_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS user_subscriptions_user_status_idx ON user_subscriptions(user_id, status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS subscription_book_unlocks_user_period_idx ON subscription_book_unlocks(user_id, period_start, period_end)`);
    await client.query(`CREATE INDEX IF NOT EXISTS newsletter_subscribers_token_idx ON newsletter_subscribers(confirmation_token)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_reading_progress_kid_idx ON kid_reading_progress(kid_profile_id, last_read_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_reading_sessions_kid_idx ON kid_reading_sessions(kid_profile_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_reading_goals_kid_active_idx ON kid_reading_goals(kid_profile_id, active, updated_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS parental_rules_kid_idx ON parental_rules(kid_profile_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_kid_created_idx ON generated_stories(kid_profile_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_kid_saved_idx ON generated_stories(kid_profile_id, saved, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_kid_favorite_idx ON generated_stories(kid_profile_id, favorite, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_profiles_user_idx ON voice_profiles(user_id, deleted_at, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_messages_user_idx ON voice_messages(user_id, deleted_at, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_audit_logs_profile_idx ON voice_audit_logs(voice_profile_id, created_at DESC)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS voice_narrations_unique_idx ON voice_narrations(voice_profile_id, book_id, text_hash)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_narrations_lookup_idx ON voice_narrations(voice_profile_id, book_id, text_hash)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_narrations_user_idx ON voice_narrations(user_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_source_idx ON generated_stories(source_story_id, version_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS learning_contents_filters_idx ON learning_contents(status, content_type, language, difficulty, age_group_min, age_group_max)`);
    await client.query(`CREATE INDEX IF NOT EXISTS learning_questions_content_idx ON learning_questions(content_id, position)`);
    await client.query(`CREATE INDEX IF NOT EXISTS learning_attempts_kid_idx ON learning_attempts(kid_profile_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_challenge_progress_kid_idx ON kid_challenge_progress(kid_profile_id, completed, updated_at DESC)`);

    await client.query(`
      INSERT INTO subscription_plans (code, name, description, monthly_price_cents, currency, book_limit, is_featured)
      VALUES
        ('one_book_monthly', 'Formule Découverte', 'Un livre au choix chaque mois pour commencer en douceur.', 299, 'EUR', 1, FALSE),
        ('two_books_monthly', 'Formule Lecture', 'Deux livres par mois pour garder un rythme régulier.', 499, 'EUR', 2, TRUE),
        ('three_books_monthly', 'Formule Passion', 'Trois livres par mois pour les petits lecteurs très curieux.', 699, 'EUR', 3, FALSE),
        ('trial_3_books_7_days', 'Essai gratuit', 'Trois livres offerts pendant 7 jours pour découvrir HKids.', 0, 'EUR', 3, FALSE)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        monthly_price_cents = EXCLUDED.monthly_price_cents,
        currency = EXCLUDED.currency,
        book_limit = EXCLUDED.book_limit,
        is_featured = EXCLUDED.is_featured,
        is_active = TRUE,
        updated_at = NOW()
    `);

    await client.query(`
      INSERT INTO learning_categories (code, name, description, pictogram, color)
      VALUES
        ('alphabet', 'Alphabet', 'Reconnaitre et retrouver les lettres.', '🔤', 'from-sky-500 to-cyan-400'),
        ('numbers', 'Chiffres', 'Compter et reconnaitre les nombres.', '🔢', 'from-emerald-500 to-lime-400'),
        ('colors', 'Couleurs', 'Reconnaitre les couleurs.', '🎨', 'from-pink-500 to-rose-400'),
        ('shapes', 'Formes', 'Reconnaitre les formes simples.', '🔵', 'from-indigo-500 to-violet-500'),
        ('languages', 'Langues', 'Decouvrir des mots simples.', '🌍', 'from-amber-400 to-orange-500'),
        ('animals', 'Animaux', 'Apprendre avec les animaux.', '🐻', 'from-orange-400 to-yellow-300')
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        pictogram = EXCLUDED.pictogram,
        color = EXCLUDED.color,
        updated_at = NOW()
    `);

    await client.query(`
      INSERT INTO learning_rewards (code, name, reward_type, icon, value, description)
      VALUES
        ('star_small', 'Petite etoile', 'stars', '⭐', 1, 'Une etoile pour encourager.'),
        ('star_big', 'Grande etoile', 'stars', '🌟', 3, 'Trois etoiles pour une belle reussite.'),
        ('badge_explorer', 'Badge explorateur', 'badge', '🏅', 1, 'Badge pour les defis termines.'),
        ('celebration', 'Bravo', 'celebration', '🎉', 1, 'Felicitations visuelles.')
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        reward_type = EXCLUDED.reward_type,
        icon = EXCLUDED.icon,
        value = EXCLUDED.value,
        description = EXCLUDED.description,
        updated_at = NOW()
    `);

    await client.query(`
      INSERT INTO learning_contents (
        title, description, content_type, quiz_type, category_id, age_group_min, age_group_max,
        language, difficulty, reward_id, status, metadata
      )
      SELECT seed.title, seed.description, seed.content_type, seed.quiz_type, lc.id,
             seed.age_group_min, seed.age_group_max, seed.language, seed.difficulty, lr.id,
             'published', seed.metadata::jsonb
      FROM (VALUES
        ('Trouve la lettre A', 'Reconnaissance de lettre.', 'alphabet', 'find_image', 'alphabet', 3, 6, 'fr', 'easy', 'star_small', '{"pictogram":"🔤"}'),
        ('Compte les etoiles', 'Compter jusqu a 3.', 'numbers', 'multiple_choice', 'numbers', 3, 6, 'fr', 'easy', 'star_small', '{"pictogram":"🔢"}'),
        ('Quelle couleur ?', 'Reconnaitre le rouge.', 'colors', 'find_image', 'colors', 2, 6, 'fr', 'easy', 'star_small', '{"pictogram":"🎨"}'),
        ('La bonne forme', 'Reconnaitre un cercle.', 'shapes', 'multiple_choice', 'shapes', 3, 7, 'fr', 'easy', 'star_small', '{"pictogram":"🔵"}'),
        ('Hello ou Bonjour', 'Apprendre un mot simple.', 'languages', 'listen_answer', 'languages', 5, 10, 'fr', 'easy', 'star_big', '{"pictogram":"🌍"}')
      ) AS seed(title, description, content_type, quiz_type, category_code, age_group_min, age_group_max, language, difficulty, reward_code, metadata)
      JOIN learning_categories lc ON lc.code = seed.category_code
      JOIN learning_rewards lr ON lr.code = seed.reward_code
      WHERE NOT EXISTS (
        SELECT 1 FROM learning_contents existing WHERE existing.title = seed.title
      )
    `);

    await client.query(`
      INSERT INTO learning_questions (content_id, question_type, prompt, options, correct_answer, explanation, position)
      SELECT lc.id, question_type, prompt, options::jsonb, correct_answer::jsonb, explanation, position
      FROM learning_contents lc
      JOIN (VALUES
        ('Trouve la lettre A', 'find_image', 'Touche A', '[{"id":"a","label":"A","pictogram":"A"},{"id":"b","label":"B","pictogram":"B"},{"id":"c","label":"C","pictogram":"C"}]', '{"value":"a"}', 'Bravo, c est la lettre A.', 1),
        ('Compte les etoiles', 'multiple_choice', 'Combien ?', '[{"id":"2","label":"2","pictogram":"⭐⭐"},{"id":"3","label":"3","pictogram":"⭐⭐⭐"},{"id":"4","label":"4","pictogram":"⭐⭐⭐⭐"}]', '{"value":"3"}', 'Il y a trois etoiles.', 1),
        ('Quelle couleur ?', 'find_image', 'Touche rouge', '[{"id":"red","label":"Rouge","pictogram":"🔴"},{"id":"blue","label":"Bleu","pictogram":"🔵"},{"id":"green","label":"Vert","pictogram":"🟢"}]', '{"value":"red"}', 'Rouge comme la pomme.', 1),
        ('La bonne forme', 'multiple_choice', 'Touche rond', '[{"id":"circle","label":"Rond","pictogram":"⚫"},{"id":"square","label":"Carre","pictogram":"⬛"},{"id":"triangle","label":"Triangle","pictogram":"🔺"}]', '{"value":"circle"}', 'Un cercle est rond.', 1),
        ('Hello ou Bonjour', 'listen_answer', 'Hello veut dire ?', '[{"id":"bonjour","label":"Bonjour","pictogram":"👋"},{"id":"nuit","label":"Nuit","pictogram":"🌙"},{"id":"chat","label":"Chat","pictogram":"🐱"}]', '{"value":"bonjour"}', 'Hello veut dire bonjour.', 1)
      ) AS q(title, question_type, prompt, options, correct_answer, explanation, position)
        ON q.title = lc.title
      WHERE NOT EXISTS (
        SELECT 1 FROM learning_questions existing WHERE existing.content_id = lc.id
      )
    `);

    await client.query(`
      INSERT INTO learning_challenges (title, description, challenge_type, target_value, category_id, reward_id, status, metadata)
      SELECT seed.title, seed.description, seed.challenge_type, seed.target_value, lc.id, lr.id, 'active', seed.metadata::jsonb
      FROM (VALUES
        ('Reussir 5 quiz', 'Reussir cinq activites.', 'quiz_success_count', 5, 'alphabet', 'badge_explorer', '{"pictogram":"🏅"}'),
        ('Decouvrir 5 animaux', 'Terminer cinq activites animaux.', 'category_success_count', 5, 'animals', 'star_big', '{"pictogram":"🐻"}'),
        ('Ecouter 3 histoires', 'Garder le lien avec la lecture.', 'listening_count', 3, 'languages', 'celebration', '{"pictogram":"🎧"}')
      ) AS seed(title, description, challenge_type, target_value, category_code, reward_code, metadata)
      LEFT JOIN learning_categories lc ON lc.code = seed.category_code
      LEFT JOIN learning_rewards lr ON lr.code = seed.reward_code
      WHERE NOT EXISTS (
        SELECT 1 FROM learning_challenges existing WHERE existing.title = seed.title
      )
    `);

    // Insérer admin par défaut
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    await client.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', defaultPassword, 'admin']
    );

    await client.query('COMMIT');
    console.log('✅ Base PostgreSQL initialisée');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur DB:', err.message);
    throw err;
  } finally {
    client.release();
  }
}
