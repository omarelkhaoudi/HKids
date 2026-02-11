# Scripts de Génération d'Images de Test

## 🎨 Générateur d'Images HTML (Recommandé)

### Utilisation

1. **Exécutez le script:**
   ```bash
   node scripts/generate-test-images-html.js
   ```

2. **Ouvrez le fichier généré:**
   - Allez dans le dossier `test-images/`
   - Ouvrez `generate-images.html` dans votre navigateur

3. **Téléchargez les images:**
   - Les images sont générées automatiquement
   - Cliquez sur "💾 Télécharger Toutes les Images"
   - Les images PNG seront téléchargées dans votre dossier de téléchargements

4. **Utilisez les images:**
   - Renommez-les si nécessaire (couverture.png, page1.png, etc.)
   - Uploadez-les dans le formulaire de création de livre

### Images Générées

- **couverture.png** - Image de couverture (800x600)
- **page1.png** à **page5.png** - Pages du livre (800x600)

---

## 📝 Script SVG (Alternative)

### Utilisation

```bash
node scripts/generate-test-images.js
```

Génère des fichiers SVG dans le dossier `test-images/`.

**Note:** Les SVG doivent être convertis en JPG/PNG pour être utilisés dans l'application.

---

## 🚀 Utilisation Rapide

1. Exécutez: `node scripts/generate-test-images-html.js`
2. Ouvrez `test-images/generate-images.html` dans votre navigateur
3. Téléchargez toutes les images
4. Uploadez-les dans votre application HKids!

---

**Astuce:** Les images générées sont parfaites pour tester l'application rapidement!

