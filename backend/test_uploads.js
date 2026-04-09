import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads', 'books');
const missingFile = '1775483095159-448372705.pdf';

console.log('🔍 Testing uploads directory...');
console.log('📂 Uploads directory exists:', fs.existsSync(uploadsDir));

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  console.log('📋 Total files:', files.length);
  
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
  console.log('📄 PDF files:', pdfFiles.length);
  
  if (pdfFiles.length > 0) {
    console.log('📄 Available PDFs:');
    pdfFiles.slice(0, 5).forEach(file => {
      console.log(`  - ${file}`);
    });
    
    const firstPdf = pdfFiles[0];
    console.log(`\n✅ Suggested fallback: ${missingFile} → ${firstPdf}`);
  }
  
  console.log(`\n❌ Missing file: ${missingFile}`);
  console.log(`❌ File exists: ${fs.existsSync(path.join(uploadsDir, missingFile))}`);
}
