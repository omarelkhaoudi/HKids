-- Script SQL pour initialiser la base de données HKids sur Supabase
-- Exécutez ce script dans le SQL Editor de Supabase

-- Users table
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

