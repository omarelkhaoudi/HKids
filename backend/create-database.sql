-- Script SQL pour créer la base de données et l'utilisateur si nécessaire
-- Exécutez ce script en tant qu'administrateur PostgreSQL

-- Créer la base de données si elle n'existe pas
SELECT 'CREATE DATABASE hkids'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hkids')\gexec

-- Se connecter à la base de données hkids
\c hkids

-- Afficher un message de confirmation
SELECT 'Base de données hkids créée avec succès!' AS message;

