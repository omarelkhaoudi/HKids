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
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
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
        admin_permissions JSONB,
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
      `CREATE TABLE IF NOT EXISTS subscription_invoices (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE SET NULL,
        stripe_invoice_id TEXT UNIQUE NOT NULL,
        stripe_subscription_id TEXT,
        amount_paid INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'EUR',
        status TEXT NOT NULL DEFAULT 'draft',
        hosted_invoice_url TEXT,
        invoice_pdf TEXT,
        period_start TIMESTAMPTZ,
        period_end TIMESTAMPTZ,
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS subscription_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE SET NULL,
        stripe_event_id TEXT UNIQUE,
        event_type TEXT NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS stripe_webhook_events (
        stripe_event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        processed_at TIMESTAMPTZ DEFAULT NOW()
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
        client_session_id TEXT,
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
      `CREATE TABLE IF NOT EXISTS kid_screen_time_sessions (
        id BIGSERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        client_session_id TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        started_at TIMESTAMPTZ NOT NULL,
        last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(kid_profile_id, client_session_id)
      );`,
      `CREATE TABLE IF NOT EXISTS kid_book_favorites (
        id BIGSERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        favorited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(kid_profile_id, book_id)
      );`,
      `CREATE TABLE IF NOT EXISTS kid_book_history (
        id BIGSERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        last_page INTEGER NOT NULL DEFAULT 0,
        open_count INTEGER NOT NULL DEFAULT 1,
        listened_seconds INTEGER NOT NULL DEFAULT 0,
        audio_duration_seconds INTEGER NOT NULL DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_listened_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(kid_profile_id, book_id)
      );`,
      `CREATE TABLE IF NOT EXISTS kid_data_imports (
        id BIGSERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        import_key TEXT NOT NULL,
        imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(kid_profile_id, import_key)
      );`,
      `CREATE TABLE IF NOT EXISTS kid_download_registry (
        id BIGSERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        content_type TEXT NOT NULL,
        content_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'downloaded',
        downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(kid_profile_id, content_type, content_id)
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
        provider TEXT NOT NULL DEFAULT 'openai',
        saved BOOLEAN DEFAULT FALSE,
        saved_at TIMESTAMPTZ,
        favorite BOOLEAN DEFAULT FALSE,
        favorited_at TIMESTAMPTZ,
        source_story_id INTEGER REFERENCES generated_stories(id) ON DELETE SET NULL,
        version_number INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS voice_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        relation TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'fr',
        status TEXT NOT NULL DEFAULT 'draft',
        provider TEXT NOT NULL DEFAULT 'elevenlabs',
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
      `CREATE TABLE IF NOT EXISTS voice_consent_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        voice_profile_id INTEGER REFERENCES voice_profiles(id) ON DELETE SET NULL,
        consent_version TEXT NOT NULL,
        legal_text_hash TEXT NOT NULL,
        scope TEXT NOT NULL DEFAULT 'voice_clone_tts_storage',
        locale TEXT NOT NULL DEFAULT 'fr',
        ip_address TEXT,
        user_agent TEXT,
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ
      );`,
      `CREATE TABLE IF NOT EXISTS voice_usage_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        voice_profile_id INTEGER REFERENCES voice_profiles(id) ON DELETE SET NULL,
        operation TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'elevenlabs',
        character_count INTEGER NOT NULL DEFAULT 0,
        request_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS voice_provider_deletion_queue (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL DEFAULT 'elevenlabs',
        provider_voice_id TEXT NOT NULL UNIQUE,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS security_audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        actor_role TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS content_reports (
        id BIGSERIAL PRIMARY KEY,
        reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'normal',
        assigned_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resolution_note TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS support_tickets (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        status TEXT NOT NULL DEFAULT 'open',
        priority TEXT NOT NULL DEFAULT 'normal',
        admin_note TEXT,
        assigned_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
      );`,
      `CREATE TABLE IF NOT EXISTS voice_narrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        voice_profile_id INTEGER REFERENCES voice_profiles(id) ON DELETE CASCADE,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        provider TEXT NOT NULL DEFAULT 'elevenlabs',
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
    await client.query(`ALTER TABLE kids_profiles ADD COLUMN IF NOT EXISTS app_preferences JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS daily_screen_time_minutes INTEGER NOT NULL DEFAULT 30`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS quiet_start_time TIME`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS quiet_end_time TIME`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS allowed_languages TEXT[] DEFAULT '{}'`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS allowed_themes TEXT[] DEFAULT '{}'`);
    await client.query(`ALTER TABLE parental_rules ADD COLUMN IF NOT EXISTS allowed_content_types TEXT[] DEFAULT '{}'`);
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
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'openai'`);
    await client.query(`ALTER TABLE generated_stories ALTER COLUMN provider SET DEFAULT 'openai'`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS saved BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS saved_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS favorite BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS favorited_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS source_story_id INTEGER REFERENCES generated_stories(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE voice_profiles ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'elevenlabs'`);
    await client.query(`ALTER TABLE voice_profiles ALTER COLUMN provider SET DEFAULT 'elevenlabs'`);
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
    await client.query(`ALTER TABLE voice_narrations ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'elevenlabs'`);
    await client.query(`ALTER TABLE voice_narrations ALTER COLUMN provider SET DEFAULT 'elevenlabs'`);
    await client.query(`ALTER TABLE voice_narrations ADD COLUMN IF NOT EXISTS provider_voice_id TEXT`);
    await client.query(`ALTER TABLE voice_narrations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE voice_narrations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE learning_contents ADD COLUMN IF NOT EXISTS reward_id INTEGER`);
    await client.query(`ALTER TABLE learning_contents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE learning_contents ADD COLUMN IF NOT EXISTS ai_generation_ready BOOLEAN DEFAULT TRUE`);
    await client.query(`ALTER TABLE learning_attempts ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE learning_attempts ADD COLUMN IF NOT EXISTS max_score INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE learning_attempts ADD COLUMN IF NOT EXISTS success BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE learning_attempts ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE learning_attempts ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]'::jsonb`);
    await client.query(`ALTER TABLE learning_attempts ADD COLUMN IF NOT EXISTS reward_payload JSONB DEFAULT '{}'::jsonb`);
    await client.query(`ALTER TABLE kid_challenge_progress ADD COLUMN IF NOT EXISTS progress_value INTEGER NOT NULL DEFAULT 0`);
    await client.query(`ALTER TABLE kid_challenge_progress ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE kid_challenge_progress ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE kid_challenge_progress ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE kid_rewards ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'learning_attempt'`);
    await client.query(`ALTER TABLE kid_rewards ADD COLUMN IF NOT EXISTS source_id INTEGER`);
    await client.query(`ALTER TABLE kid_rewards ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb`);
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
    await client.query(`ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_permissions JSONB`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'approved'`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS moderation_note TEXT`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'pending'`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS moderation_note TEXT`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE generated_stories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id TEXT`);
    await client.query(`ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 0`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_unique_idx ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS subscription_invoices_user_paid_idx ON subscription_invoices(user_id, paid_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS subscription_events_user_created_idx ON subscription_events(user_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS user_subscriptions_provider_sub_idx ON user_subscriptions(provider, provider_subscription_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_download_registry_kid_idx ON kid_download_registry(kid_profile_id, downloaded_at DESC)`);
    await client.query(`ALTER TABLE kid_reading_sessions ADD COLUMN IF NOT EXISTS client_session_id TEXT`);
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS content_localizations (
        id SERIAL PRIMARY KEY,
        content_type TEXT NOT NULL,
        content_id INTEGER NOT NULL,
        locale TEXT NOT NULL,
        title TEXT,
        description TEXT,
        body TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (content_type, content_id, locale)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS book_audio_tracks (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        locale TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (book_id, locale)
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS content_localizations_lookup_idx ON content_localizations (content_type, content_id, locale)`);
    await client.query(`CREATE INDEX IF NOT EXISTS content_localizations_locale_idx ON content_localizations (locale, content_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS book_audio_tracks_book_locale_idx ON book_audio_tracks (book_id, locale)`);

    await client.query(`CREATE INDEX IF NOT EXISTS books_cms_filters_idx ON books(is_published, is_premium, is_recommended, is_popular, is_new, publish_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS categories_parent_idx ON categories(parent_id)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS book_pages_book_page_unique ON book_pages(book_id, page_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS user_subscriptions_user_status_idx ON user_subscriptions(user_id, status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS subscription_book_unlocks_user_period_idx ON subscription_book_unlocks(user_id, period_start, period_end)`);
    await client.query(`CREATE INDEX IF NOT EXISTS newsletter_subscribers_token_idx ON newsletter_subscribers(confirmation_token)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_reading_progress_kid_idx ON kid_reading_progress(kid_profile_id, last_read_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_reading_sessions_kid_idx ON kid_reading_sessions(kid_profile_id, created_at DESC)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS kid_reading_sessions_client_unique_idx ON kid_reading_sessions(kid_profile_id, client_session_id) WHERE client_session_id IS NOT NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_reading_goals_kid_active_idx ON kid_reading_goals(kid_profile_id, active, updated_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kids_profiles_parent_idx ON kids_profiles(parent_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_screen_sessions_kid_time_idx ON kid_screen_time_sessions(kid_profile_id, started_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_favorites_kid_time_idx ON kid_book_favorites(kid_profile_id, favorited_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_history_kid_opened_idx ON kid_book_history(kid_profile_id, last_opened_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS kid_reading_sessions_book_idx ON kid_reading_sessions(kid_profile_id, book_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS parental_rules_kid_idx ON parental_rules(kid_profile_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_kid_created_idx ON generated_stories(kid_profile_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_kid_saved_idx ON generated_stories(kid_profile_id, saved, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_kid_favorite_idx ON generated_stories(kid_profile_id, favorite, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_profiles_user_idx ON voice_profiles(user_id, deleted_at, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_messages_user_idx ON voice_messages(user_id, deleted_at, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_audit_logs_profile_idx ON voice_audit_logs(voice_profile_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS security_audit_logs_user_idx ON security_audit_logs(user_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS security_audit_logs_action_idx ON security_audit_logs(action, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS content_reports_status_idx ON content_reports(status, priority, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS content_reports_target_idx ON content_reports(target_type, target_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status, priority, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON support_tickets(user_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS books_moderation_idx ON books(moderation_status, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_moderation_idx ON generated_stories(moderation_status, created_at DESC)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS voice_narrations_unique_idx ON voice_narrations(voice_profile_id, book_id, text_hash)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_narrations_lookup_idx ON voice_narrations(voice_profile_id, book_id, text_hash)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_narrations_user_idx ON voice_narrations(user_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_consent_profile_idx ON voice_consent_records(voice_profile_id, granted_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_usage_user_month_idx ON voice_usage_records(user_id, created_at DESC)`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS voice_usage_request_unique_idx ON voice_usage_records(request_hash) WHERE request_hash IS NOT NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS voice_deletion_queue_user_idx ON voice_provider_deletion_queue(user_id, updated_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS generated_stories_source_idx ON generated_stories(source_story_id, version_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS learning_contents_filters_idx ON learning_contents(status, content_type, language, difficulty, age_group_min, age_group_max)`);
    await client.query(`CREATE INDEX IF NOT EXISTS learning_questions_content_idx ON learning_questions(content_id, position)`);
    await client.query(`CREATE INDEX IF NOT EXISTS learning_attempts_kid_idx ON learning_attempts(kid_profile_id, created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS learning_attempts_kid_success_idx ON learning_attempts(kid_profile_id, success, created_at DESC)`);
    await client.query(`
      DELETE FROM kid_challenge_progress duplicate
      USING kid_challenge_progress keeper
      WHERE duplicate.kid_profile_id = keeper.kid_profile_id
        AND duplicate.challenge_id = keeper.challenge_id
        AND duplicate.id < keeper.id
    `);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS kid_challenge_progress_unique_idx ON kid_challenge_progress(kid_profile_id, challenge_id)`);
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
        ('Hello ou Bonjour', 'Apprendre un mot simple.', 'languages', 'listen_answer', 'languages', 5, 10, 'fr', 'easy', 'star_big', '{"pictogram":"🌍"}'),
        ('Jeu de memoire', 'Trouve les paires identiques.', 'game', NULL, 'animals', 3, 7, 'fr', 'easy', 'star_small', '{"pictogram":"🎮","game_type":"memory","pairs":[{"id":"1","pictogram":"🐶"},{"id":"2","pictogram":"🐱"},{"id":"3","pictogram":"🐻"},{"id":"4","pictogram":"🦊"}]}')
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

    await client.query(`
      INSERT INTO categories (name, description)
      VALUES
        ('Histoires', 'Histoires illustrees et audio pour enfants'),
        ('Comptines', 'Comptines et chansons douces'),
        ('Dinosaures', 'Univers dinosaures'),
        ('Espace', 'Decouverte de l espace')
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query(`
      INSERT INTO books (
        title, slug, author, description, cover_image, file_path, content_type, language, theme,
        category_id, age_group_min, age_group_max, audio_url, duration_seconds,
        is_published, moderation_status, page_count
      )
      SELECT
        seed.title, seed.slug, seed.author, seed.description, seed.cover_image, seed.file_path,
        seed.content_type, seed.language, seed.theme, c.id, seed.age_group_min, seed.age_group_max,
        seed.audio_url, seed.duration_seconds, TRUE, 'approved', seed.page_count
      FROM (VALUES
        ('Le petit dinosaure courageux', 'demo-dino-courage', 'HKids', 'Une petite histoire sur la confiance.', NULL, 'demo/dino-courage.story', 'story', 'fr', 'dinosaurs', 'Dinosaures', 3, 6, NULL, 0, 1),
        ('Voyage sur la lune', 'demo-voyage-lune', 'HKids', 'Un voyage doux dans l espace.', NULL, 'demo/voyage-lune.story', 'story', 'fr', 'space', 'Espace', 4, 8, NULL, 0, 1),
        ('Comptine des etoiles', 'demo-comptine-etoiles', 'HKids', 'Une comptine pour le coucher.', NULL, 'demo/comptine-etoiles.audio', 'audio_story', 'fr', 'space', 'Comptines', 2, 6, 'demo/comptine-etoiles.mp3', 95, 0),
        ('Bonne nuit petit ours', 'demo-bonne-nuit-ours', 'HKids', 'Une berceuse douce.', NULL, 'demo/bonne-nuit-ours.audio', 'audio_story', 'fr', 'animals', 'Comptines', 2, 5, 'demo/bonne-nuit-ours.mp3', 110, 0),
        ('Les trois petits cochons', 'demo-trois-cochons', 'HKids', 'Un classique adapte aux tout-petits.', NULL, 'demo/trois-cochons.story', 'story', 'fr', 'world', 'Histoires', 3, 7, NULL, 0, 2)
      ) AS seed(title, slug, author, description, cover_image, file_path, content_type, language, theme, category_name, age_group_min, age_group_max, audio_url, duration_seconds, page_count)
      JOIN categories c ON c.name = seed.category_name
      WHERE NOT EXISTS (
        SELECT 1 FROM books existing WHERE existing.slug = seed.slug
      )
    `);

    await client.query(`
      INSERT INTO book_pages (book_id, page_number, image_path, content)
      SELECT b.id, page.page_number, NULL, page.content
      FROM books b
      JOIN (VALUES
        ('demo-dino-courage', 1, 'Il etait une fois un petit dinosaure qui avait peur du noir.'),
        ('demo-voyage-lune', 1, 'Ce soir, la fusee decolle doucement vers la lune.'),
        ('demo-trois-cochons', 1, 'Trois petits cochons construisent chacun une maison.'),
        ('demo-trois-cochons', 2, 'Le loup souffle, mais la maison de briques tient bon.')
      ) AS page(slug, page_number, content)
        ON page.slug = b.slug
      WHERE NOT EXISTS (
        SELECT 1 FROM book_pages existing
        WHERE existing.book_id = b.id AND existing.page_number = page.page_number
      )
    `);

    await client.query(`
      INSERT INTO content_localizations (content_type, content_id, locale, title, description)
      SELECT 'book', b.id, b.language, b.title, b.description
      FROM books b
      ON CONFLICT (content_type, content_id, locale) DO NOTHING
    `);

    await client.query(`
      INSERT INTO content_localizations (content_type, content_id, locale, title, description)
      SELECT 'book', b.id, seed.locale, seed.title, seed.description
      FROM books b
      JOIN (VALUES
        ('demo-dino-courage', 'en', 'The brave little dinosaur', 'A short story about confidence.'),
        ('demo-dino-courage', 'ar', 'الديناصور الصغير الشجاع', 'قصة قصيرة عن الثقة.'),
        ('demo-voyage-lune', 'en', 'Trip to the moon', 'A gentle journey through space.'),
        ('demo-voyage-lune', 'ar', 'رحلة إلى القمر', 'رحلة هادئة في الفضاء.'),
        ('demo-comptine-etoiles', 'en', 'Star lullaby', 'A bedtime rhyme.'),
        ('demo-comptine-etoiles', 'ar', 'أنشودة النجوم', 'أنشودة للنوم.'),
        ('demo-bonne-nuit-ours', 'en', 'Good night little bear', 'A soft lullaby.'),
        ('demo-bonne-nuit-ours', 'ar', 'تصبح على خير أيها الدب', 'تهويدة ناعمة.'),
        ('demo-trois-cochons', 'en', 'The three little pigs', 'A classic for toddlers.'),
        ('demo-trois-cochons', 'ar', 'الخنازير الثلاثة الصغيرة', 'كلاسيكية للصغار.')
      ) AS seed(slug, locale, title, description) ON seed.slug = b.slug
      ON CONFLICT (content_type, content_id, locale) DO NOTHING
    `);

    await client.query(`
      INSERT INTO book_audio_tracks (book_id, locale, audio_url, duration_seconds, is_default)
      SELECT b.id, 'fr', b.audio_url, b.duration_seconds, TRUE
      FROM books b
      WHERE b.audio_url IS NOT NULL
      ON CONFLICT (book_id, locale) DO NOTHING
    `);

    await client.query(`
      INSERT INTO book_audio_tracks (book_id, locale, audio_url, duration_seconds, is_default)
      SELECT b.id, seed.locale, b.audio_url, b.duration_seconds, FALSE
      FROM books b
      JOIN (VALUES
        ('demo-comptine-etoiles', 'en'),
        ('demo-comptine-etoiles', 'ar'),
        ('demo-bonne-nuit-ours', 'en'),
        ('demo-bonne-nuit-ours', 'ar')
      ) AS seed(slug, locale) ON seed.slug = b.slug
      WHERE b.audio_url IS NOT NULL
      ON CONFLICT (book_id, locale) DO NOTHING
    `);

    // Seed credentials are development-only unless an explicit production password exists.
    const seedAdminPassword = process.env.ADMIN_SEED_PASSWORD
      || (process.env.NODE_ENV === 'production' ? null : 'admin123');
    if (seedAdminPassword) {
      if (seedAdminPassword.length < 12 && process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_SEED_PASSWORD must contain at least 12 characters in production');
      }
      const seedAdminUsername = process.env.ADMIN_SEED_USERNAME || 'admin';
      const defaultPassword = bcrypt.hashSync(seedAdminPassword, 12);
      await client.query(
        `INSERT INTO users (username, password, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING`,
        [seedAdminUsername, defaultPassword, 'admin']
      );
    }

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
