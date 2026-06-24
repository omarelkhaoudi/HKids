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
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        age_group_min INTEGER DEFAULT 0,
        age_group_max INTEGER DEFAULT 12,
        page_count INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT FALSE,
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
      );`
    ];

    for (const tableQuery of tables) await client.query(tableQuery);

    await client.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS slug TEXT`);
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
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS book_pages_book_page_unique ON book_pages(book_id, page_number)`);
    await client.query(`CREATE INDEX IF NOT EXISTS user_subscriptions_user_status_idx ON user_subscriptions(user_id, status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS subscription_book_unlocks_user_period_idx ON subscription_book_unlocks(user_id, period_start, period_end)`);
    await client.query(`CREATE INDEX IF NOT EXISTS newsletter_subscribers_token_idx ON newsletter_subscribers(confirmation_token)`);

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
