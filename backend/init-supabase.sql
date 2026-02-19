-- Script SQL pour initialiser la base de données HKids sur Supabase
-- Exécutez ce script dans le SQL Editor de Supabase

-- Users table (created first, kid_profile_id will be added later)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table
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

-- Book pages table
CREATE TABLE IF NOT EXISTS book_pages (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_path TEXT,
  content TEXT
);

-- Kids profiles table
CREATE TABLE IF NOT EXISTS kids_profiles (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  age INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent approvals table - stores which categories are approved for each kid
CREATE TABLE IF NOT EXISTS parent_approvals (
  id SERIAL PRIMARY KEY,
  kid_profile_id INTEGER NOT NULL REFERENCES kids_profiles(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_profile_id, category_id)
);

-- Add kid_profile_id column to users table (after kids_profiles is created)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'kid_profile_id'
  ) THEN
    ALTER TABLE users ADD COLUMN kid_profile_id INTEGER REFERENCES kids_profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Insert default categories
INSERT INTO categories (name, description)
VALUES 
  ('Fiction', 'Fictional stories and tales'),
  ('Educational', 'Educational content'),
  ('Adventure', 'Adventure stories'),
  ('Animals', 'Stories about animals')
ON CONFLICT (name) DO NOTHING;

-- Note: L'utilisateur admin sera créé automatiquement par le backend
-- lors du premier démarrage avec le mot de passe: admin123
-- Pas besoin de l'insérer manuellement ici

-- Afficher un message de confirmation
SELECT 'Base de données HKids initialisée avec succès!' AS message;

