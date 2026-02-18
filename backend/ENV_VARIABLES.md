# 🔐 Variables d'Environnement à Configurer sur Vercel

## Variables Obligatoires

### 1. Base de Données PostgreSQL

**Si vous utilisez Supabase :**
- `DB_HOST` : `db.xxxxx.supabase.co` (remplacez xxxxx par votre ID Supabase)
- `DB_PORT` : `5432`
- `DB_USER` : `postgres`
- `DB_PASSWORD` : (le mot de passe que vous avez défini lors de la création du projet)
- `DB_NAME` : `postgres`

**Si vous utilisez Neon :**
- `DB_HOST` : (fourni dans votre dashboard Neon)
- `DB_PORT` : `5432`
- `DB_USER` : (fourni dans votre dashboard Neon)
- `DB_PASSWORD` : (fourni dans votre dashboard Neon)
- `DB_NAME` : (fourni dans votre dashboard Neon)

### 2. Sécurité

**JWT_SECRET** : Générer un secret sécurisé
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Copiez le résultat et utilisez-le comme valeur.

### 3. Configuration

- `CORS_ORIGIN` : URL de votre frontend déployé
  - Exemple : `https://votre-frontend.vercel.app`
  - Ou : `https://hkids-frontend.vercel.app` (si c'est le nom de votre projet frontend)
  
- `NODE_ENV` : `production`

- `VERCEL` : `1`

## 📝 Comment Ajouter les Variables

### Option A : Via Dashboard Vercel (Recommandé)

1. Allez sur : https://vercel.com/el-khaoudi-omars-projects/backend
2. Cliquez sur **Settings** (en haut)
3. Cliquez sur **Environment Variables** (dans le menu de gauche)
4. Pour chaque variable :
   - Cliquez sur **Add New**
   - Entrez le **Key** (ex: `DB_HOST`)
   - Entrez la **Value** (ex: `db.xxxxx.supabase.co`)
   - Sélectionnez les environnements : **Production**, **Preview**, **Development**
   - Cliquez sur **Save**

### Option B : Via CLI

```bash
cd backend
vercel env add DB_HOST
vercel env add DB_PORT
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add JWT_SECRET
vercel env add CORS_ORIGIN
vercel env add NODE_ENV production
vercel env add VERCEL 1
```

Pour chaque commande, entrez la valeur correspondante quand demandé.

## ⚠️ Important

- **Toutes les variables doivent être ajoutées** pour que l'API fonctionne
- **CORS_ORIGIN** doit correspondre exactement à l'URL de votre frontend (avec `https://`)
- Après avoir ajouté les variables, **redéployez** le projet

