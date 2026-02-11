import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier de sortie
const outputDir = path.join(__dirname, '../test-images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fonction pour créer une image SVG simple (qui sera convertie en PNG)
function createSVGImage(text, bgColor, textColor, width = 800, height = 600) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
    ${text}
  </text>
</svg>`;
}

// Couleurs pour les différentes pages
const colors = [
  { bg: '#FFE5E5', text: '#8B0000' }, // Rose clair
  { bg: '#E5F3FF', text: '#00008B' }, // Bleu clair
  { bg: '#E5FFE5', text: '#006400' }, // Vert clair
  { bg: '#FFF5E5', text: '#8B4500' }, // Orange clair
  { bg: '#F0E5FF', text: '#4B0082' }, // Violet clair
  { bg: '#FFE5F0', text: '#8B008B' }, // Magenta clair
];

// Générer la couverture
const coverSVG = createSVGImage(
  '📚 Mon Premier Livre\n\nUne Aventure Magique',
  '#FF6B9D',
  '#FFFFFF',
  800,
  600
);

// Générer les pages
const pages = [
  'Page 1\n\nIl était une fois...',
  'Page 2\n\nDans un pays lointain...',
  'Page 3\n\nVivait un petit héros...',
  'Page 4\n\nQui partit à l\'aventure...',
  'Page 5\n\nEt découvrit de merveilleux amis!',
  'Page 6\n\nIls vécurent heureux...',
];

console.log('🎨 Génération des images de test...\n');

// Sauvegarder la couverture
const coverPath = path.join(outputDir, 'couverture.svg');
fs.writeFileSync(coverPath, coverSVG);
console.log('✅ Couverture créée: couverture.svg');

// Sauvegarder les pages
pages.forEach((pageText, index) => {
  const color = colors[index % colors.length];
  const pageSVG = createSVGImage(pageText, color.bg, color.text);
  const pagePath = path.join(outputDir, `page${index + 1}.svg`);
  fs.writeFileSync(pagePath, pageSVG);
  console.log(`✅ Page ${index + 1} créée: page${index + 1}.svg`);
});

console.log('\n✨ Images SVG générées avec succès!');
console.log(`📁 Emplacement: ${outputDir}`);
console.log('\n💡 Note: Les fichiers sont en format SVG.');
console.log('   Pour les convertir en JPG/PNG, vous pouvez:');
console.log('   1. Les ouvrir dans un navigateur');
console.log('   2. Faire un clic droit > Enregistrer l\'image');
console.log('   3. Ou utiliser un convertisseur en ligne\n');

