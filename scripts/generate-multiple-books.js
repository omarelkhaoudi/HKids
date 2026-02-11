import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier de sortie
const outputDir = path.join(__dirname, '../test-images/multiple-books');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('📚 Générateur de Livres Multiples pour HKids\n');
console.log('✅ Fichier HTML créé: test-images/generate-multiple-books.html');
console.log('\n📝 Instructions:');
console.log('1. Ouvrez generate-multiple-books.html dans votre navigateur');
console.log('2. Cliquez sur "Générer Tous les Livres"');
console.log('3. Cliquez sur "Télécharger Tous les Livres"');
console.log('4. Vous aurez 5 livres différents avec plusieurs pages chacun');
console.log('\n✨ Les livres générés:');
console.log('  - L\'Aventure du Petit Ours (6 pages)');
console.log('  - Les Animaux de la Ferme (6 pages)');
console.log('  - Le Voyage dans l\'Espace (6 pages)');
console.log('  - La Forêt Enchantée (6 pages)');
console.log('  - Les Super-Héros (6 pages)');

