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
      );`
    ];

    for (const tableQuery of tables) await client.query(tableQuery);

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