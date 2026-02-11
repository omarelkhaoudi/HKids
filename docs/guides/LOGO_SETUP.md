# 🎨 Configuration du Logo HKids

## ✅ Ce qui a été fait

J'ai intégré le système de logo dans l'application. Le logo apparaîtra automatiquement une fois que vous aurez placé votre image.

## 📁 Où placer l'image

1. **Placez votre image** dans le dossier : `frontend/public/`
2. **Nommez-la** : `logo.png`
3. **Format recommandé** : PNG (avec fond transparent) ou JPG
4. **Taille recommandée** : 
   - Minimum : 256x256 pixels
   - Optimal : 512x512 pixels ou plus
   - Format carré pour un meilleur rendu

## 📍 Emplacements du logo

Le logo apparaîtra automatiquement dans :

- ✅ **Page d'accueil** (`/`) - Header en haut à gauche
- ✅ **Page Admin Login** (`/admin/login`) - Centré en haut
- ✅ **Dashboard Admin** (`/admin`) - Header du sidebar

## 🔄 Après avoir placé l'image

1. Placez votre image `logo.png` dans `frontend/public/`
2. Rafraîchissez votre navigateur (F5 ou Ctrl+R)
3. Le logo devrait apparaître automatiquement !

## 🎨 Personnalisation

Le composant Logo accepte plusieurs props :

```jsx
<Logo 
  size="default"      // "small" | "default" | "large"
  showText={true}     // Afficher/masquer le texte "HKids"
  isLink={true}       // Rendre le logo cliquable (lien vers home)
  className=""        // Classes CSS supplémentaires
/>
```

## 🔧 Fallback automatique

Si l'image `logo.png` n'est pas trouvée, le système utilisera automatiquement une icône de livre stylisée comme fallback.

## 📝 Structure des fichiers

```
frontend/
  public/
    logo.png          ← Placez votre image ici
    README.md
  src/
    components/
      Logo.jsx        ← Composant Logo
```

---

**Note** : Une fois l'image placée, le logo s'affichera automatiquement sur toutes les pages concernées !

