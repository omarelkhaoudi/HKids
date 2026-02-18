# 🔐 Configuration des Variables d'Environnement sur Vercel

## 📋 Informations de votre Base Supabase

D'après votre connection string :
- **Host** :** `db.kueenrvthimjutyukdej.supabase.co`
- **Port** : `5432`
- **User** : `postgres`
- **Database** : `postgres`
- **Password** : ⚠️ **Remplacez [YOUR-PASSWORD] par votre vrai mot de passe Supabase**

## 🎯 Étapes pour Configurer sur Vercel Dashboard

### 1. Ouvrir le Dashboard Vercel

Allez sur : **https://vercel.com/el-khaoudi-omars-projects/backend**

### 2. Aller dans Settings → Environment Variables

1. Cliquez sur **Settings** (en haut à droite)
2. Dans le menu de gauche, cliquez sur **Environment Variables**

### 3. Ajouter les Variables

Pour chaque variable ci-dessous, cliquez sur **Add New** et remplissez :

#### Variable 1 : DB_HOST
- **Key** : `DB_HOST`
- **Value** : `db.kueenrvthimjutyukdej.supabase.co`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

#### Variable 2 : DB_PORT
- **Key** : `DB_PORT`
- **Value** : `5432`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

#### Variable 3 : DB_USER
- **Key** : `DB_USER`
- **Value** : `postgres`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

#### Variable 4 : DB_PASSWORD
- **Key** : `DB_PASSWORD`
- **Value** : ⚠️ **Votre mot de passe Supabase** (celui que vous avez défini lors de la création du projet)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

#### Variable 5 : DB_NAME
- **Key** : `DB_NAME`
- **Value** : `postgres`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

#### Variable 6 : JWT_SECRET
- **Key** : `JWT_SECRET`
- **Value** : `k0r07HOro0M6jH9o4Tl0IKv08l9bB8Oxx4DTo7rKF6Y=`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

#### Variable 7 : CORS_ORIGIN
- **Key** : `CORS_ORIGIN`
- **Value** : `https://votre-frontend.vercel.app` ⚠️ **Remplacez par l'URL de votre frontend déployé**
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

#### Variable 8 : NODE_ENV
- **Key** : `NODE_ENV`
- **Value** : `production`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

#### Variable 9 : VERCEL
- **Key** : `VERCEL`
- **Value** : `1`
- **Environments** : ✅ Production, ✅ Preview, ✅ Development
- Cliquez sur **Save**

## ✅ Vérification

Une fois toutes les variables ajoutées, vous devriez voir 9 variables dans la liste.

## 🚀 Prochaine Étape

Après avoir configuré toutes les variables, redéployez en production :

```bash
cd backend
vercel --prod
```

## ⚠️ Notes Importantes

1. **DB_PASSWORD** : Assurez-vous d'utiliser le **vrai mot de passe** que vous avez défini lors de la création du projet Supabase (pas `[YOUR-PASSWORD]`)

2. **CORS_ORIGIN** : Remplacez `votre-frontend.vercel.app` par l'URL réelle de votre frontend déployé sur Vercel. Si vous ne l'avez pas encore déployé, vous pouvez mettre temporairement `*` (mais ce n'est pas recommandé pour la production)

3. Toutes les variables doivent être ajoutées pour **Production**, **Preview**, et **Development**

