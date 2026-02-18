# 🗄️ Initialiser la Base de Données Supabase

## 📋 Étapes pour Initialiser la Base de Données

### Option 1 : Via SQL Editor (Recommandé)

1. **Ouvrez Supabase Dashboard**
   - Allez sur : https://supabase.com/dashboard/project/kueenrvthimjutyukdej
   - Ou via votre dashboard Supabase

2. **Ouvrez le SQL Editor**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"**

3. **Copiez et Collez le Script SQL**
   - Ouvrez le fichier `init-supabase.sql` dans ce dossier
   - Copiez tout le contenu
   - Collez-le dans le SQL Editor de Supabase

4. **Exécutez le Script**
   - Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter`)
   - Vous devriez voir : "Base de données HKids initialisée avec succès!"

5. **Vérifiez les Tables**
   - Allez dans **Database** → **Tables**
   - Vous devriez voir 4 tables :
     - `users`
     - `categories`
     - `books`
     - `book_pages`

### Option 2 : Via l'Application (Automatique)

Lorsque vous déployez votre backend sur Fly.io, la fonction `initDatabase()` s'exécutera automatiquement et créera les tables si elles n'existent pas.

**Mais** : Il est recommandé d'initialiser manuellement d'abord pour vérifier que tout fonctionne.

## ✅ Vérification

Après avoir exécuté le script, vérifiez que les tables sont créées :

1. Dans Supabase Dashboard → **Database** → **Tables**
2. Vous devriez voir :
   - ✅ `users` (avec 1 utilisateur admin)
   - ✅ `categories` (avec 4 catégories par défaut)
   - ✅ `books` (vide pour l'instant)
   - ✅ `book_pages` (vide pour l'instant)

## 🔐 Compte Admin par Défaut

**Important** : Le script crée un utilisateur admin, mais le mot de passe hashé dans le script n'est pas valide. 

**Pour créer un vrai admin** :
1. Déployez d'abord votre backend
2. Le backend créera automatiquement un admin avec le mot de passe : `admin123`
3. Ou utilisez l'API pour créer un utilisateur

## 📝 Notes

- Les tables sont créées avec `IF NOT EXISTS`, donc vous pouvez réexécuter le script sans problème
- Les catégories par défaut sont insérées avec `ON CONFLICT DO NOTHING`, donc pas de doublons
- L'utilisateur admin est créé de la même manière

