import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Fonction pour valider et parser DATABASE_URL
function parseDatabaseUrl(url) {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
      return null;
    }
    
    // Vérifier que le username est présent
    if (!parsed.username) {
      return null;
    }
    
    // Extraire les composants pour validation
    const password = parsed.password || '';
    const host = parsed.hostname || 'localhost';
    const port = parsed.port || '5432';
    const database = parsed.pathname ? parsed.pathname.slice(1) : 'hkids';
    
    return {
      connectionString: url,
      isValid: true,
      user: parsed.username,
      password: password,
      host: host,
      port: parseInt(port, 10),
      database: database
    };
  } catch (e) {
    return null;
  }
}

// Configuration PostgreSQL
let poolConfig = {};
const dbUrl = parseDatabaseUrl(process.env.DATABASE_URL);
let useConnectionString = false;

// Debug: Afficher ce qui est détecté (sans afficher le mot de passe complet)
if (process.env.DATABASE_URL) {
  const urlForDebug = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔍 DATABASE_URL détecté: ${urlForDebug}`);
} else {
  console.log('🔍 DATABASE_URL non défini, vérification des variables DB_*...');
  if (process.env.DB_USER || process.env.DB_PASSWORD || process.env.DB_NAME) {
    console.log(`   DB_USER=${process.env.DB_USER || 'non défini'}`);
    console.log(`   DB_PASSWORD=${process.env.DB_PASSWORD ? '****' : 'non défini'}`);
    console.log(`   DB_NAME=${process.env.DB_NAME || 'non défini'}`);
  }
}

if (dbUrl && dbUrl.isValid) {
  // Si le mot de passe est vide dans l'URL, utiliser les variables séparées à la place
  // car pg ne gère pas bien les mots de passe vides dans connectionString
  if (dbUrl.password === '' && !process.env.DB_PASSWORD) {
    console.warn('⚠️  DATABASE_URL a un mot de passe vide. Utilisation des variables séparées...');
    poolConfig = {
      host: process.env.DB_HOST || dbUrl.host,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : dbUrl.port,
      user: process.env.DB_USER || dbUrl.user,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || dbUrl.database,
    };
  } else if (dbUrl.password && dbUrl.password.length > 0) {
    // Utiliser DATABASE_URL si valide et avec mot de passe
    console.log('✅ Utilisation de DATABASE_URL avec mot de passe');
    poolConfig = {
      connectionString: process.env.DATABASE_URL,
    };
    useConnectionString = true;
  } else {
    // Fallback: utiliser les variables séparées
    console.warn('⚠️  Utilisation des variables séparées (DB_*)');
    poolConfig = {
      host: process.env.DB_HOST || dbUrl.host || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : (dbUrl.port || 5432),
      user: process.env.DB_USER || dbUrl.user || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || dbUrl.database || 'hkids',
    };
  }
} else {
  // Sinon, utiliser les variables individuelles
  if (process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL mal formaté, utilisation des variables séparées (DB_*)');
  }
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hkids',
  };
}

// Validation finale AVANT de créer le pool
const finalPassword = useConnectionString ? (dbUrl?.password || '') : (process.env.DB_PASSWORD || poolConfig.password || '');

let pool;

if (!finalPassword || finalPassword.trim() === '') {
  console.error('❌ Erreur: Mot de passe PostgreSQL manquant');
  console.error('   Le mot de passe est requis pour se connecter à PostgreSQL.');
  console.error('');
  if (process.env.DATABASE_URL) {
    console.error('   Votre DATABASE_URL actuel semble avoir un mot de passe vide.');
    console.error('   Format correct: DATABASE_URL=postgres://user:VOTRE_MOT_DE_PASSE@localhost:5432/database');
    console.error('   Exemple: DATABASE_URL=postgres://postgres:postgres123@localhost:5432/hkids');
  } else {
    console.error('   Option 1 - Utilisez DATABASE_URL:');
    console.error('   DATABASE_URL=postgres://postgres:postgres123@localhost:5432/hkids');
    console.error('');
    console.error('   Option 2 - Utilisez les variables séparées:');
    console.error('   DB_USER=postgres');
    console.error('   DB_PASSWORD=postgres123');
    console.error('   DB_NAME=hkids');
    console.error('   DB_HOST=localhost');
    console.error('   DB_PORT=5432');
  }
  // Créer un pool factice qui échouera proprement
  pool = null;
} else {
  // Debug: confirmer la configuration utilisée
  if (useConnectionString) {
    console.log(`✅ Configuration: DATABASE_URL (user: ${dbUrl.user}, database: ${dbUrl.database})`);
  } else {
    console.log(`✅ Configuration: Variables séparées (user: ${poolConfig.user}, database: ${poolConfig.database})`);
  }
  // Pool PostgreSQL partagé - seulement si le mot de passe est valide
  pool = new Pool(poolConfig);
  
  // Gestion des erreurs de connexion (seulement si pool existe)
  pool.on('error', (err) => {
    console.error('❌ Erreur PostgreSQL inattendue:', err);
  });
}

export function getDatabase() {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Please check your .env configuration.');
  }
  return pool;
}

export async function initDatabase() {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized. Please configure DATABASE_URL or DB_* variables in .env');
  }
  
  let client;
  
  try {
    // Tester la connexion
    client = await pool.connect();
    console.log('✅ Connexion PostgreSQL établie');
    
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        kid_profile_id INTEGER REFERENCES kids_profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Books table
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        description TEXT,
        cover_image TEXT,
        file_path TEXT NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        age_group_min INTEGER DEFAULT 0,
        age_group_max INTEGER DEFAULT 12,
        page_count INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Book pages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS book_pages (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        page_number INTEGER NOT NULL,
        image_path TEXT,
        content TEXT
      );
    `);

    // Kids profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS kids_profiles (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        avatar TEXT,
        age INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Parent approvals table - stores which categories are approved for each kid
    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_approvals (
        id SERIAL PRIMARY KEY,
        kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        approved BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(kid_profile_id, category_id)
      );
    `);

    // Default categories
    const defaultCategories = [
      { name: 'Fiction', description: 'Fictional stories and tales' },
      { name: 'Educational', description: 'Educational content' },
      { name: 'Adventure', description: 'Adventure stories' },
      { name: 'Animals', description: 'Stories about animals' },
    ];

    for (const cat of defaultCategories) {
      await client.query(
        `INSERT INTO categories (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [cat.name, cat.description]
      );
    }

    // Default admin user
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    await client.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', defaultPassword, 'admin']
    );

    await client.query('COMMIT');
    console.log('✅ PostgreSQL database initialized');
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        // Ignore rollback errors
      }
    }
    
    if (err.message && err.message.includes('password must be a string')) {
      console.error('❌ Erreur de connexion PostgreSQL:');
      console.error('   Le mot de passe dans DATABASE_URL est vide ou invalide.');
      console.error('   Vérifiez votre fichier .env dans le dossier backend/');
      console.error('   Format: DATABASE_URL=postgres://user:password@localhost:5432/database');
      console.error('   Si pas de mot de passe: postgres://user:@localhost:5432/database');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('❌ Erreur de connexion PostgreSQL:');
      console.error('   Impossible de se connecter au serveur PostgreSQL.');
      console.error('   Vérifiez que PostgreSQL est démarré et accessible.');
    } else if (err.code === '3D000') {
      console.error('❌ Erreur de connexion PostgreSQL:');
      console.error('   La base de données n\'existe pas.');
      console.error('   Créez la base de données dans pgAdmin ou avec: createdb hkids');
    } else if (err.code === '28P01') {
      console.error('❌ Erreur de connexion PostgreSQL:');
      console.error('   Authentification échouée. Vérifiez votre nom d\'utilisateur et mot de passe.');
    } else {
      console.error('❌ Database initialization failed:', err.message || err);
    }
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
}
