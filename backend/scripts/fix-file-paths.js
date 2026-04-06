import { getDatabase } from '../database/init.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixFilePaths() {
  try {
    console.log('🔧 Starting file path fixes...');
    
    const pool = getDatabase();
    const uploadsDir = path.join(__dirname, '../uploads/books');
    
    // Get all book pages with incorrect paths
    const result = await pool.query(`
      SELECT bp.id, bp.book_id, bp.page_number, bp.image_path 
      FROM book_pages bp 
      WHERE bp.image_path IS NOT NULL 
      AND bp.image_path LIKE '/uploads/books/%/%'
    `);
    
    console.log(`📄 Found ${result.rows.length} pages with incorrect paths`);
    
    for (const page of result.rows) {
      const oldPath = page.image_path;
      
      // Extract filename from the old path (remove book_id subdirectories)
      const pathParts = oldPath.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // Create new correct path
      const newPath = `/uploads/books/${filename}`;
      
      // Check if file exists
      const fullPath = path.join(uploadsDir, filename);
      const fileExists = await fs.pathExists(fullPath);
      
      if (fileExists) {
        // Update database
        await pool.query(
          'UPDATE book_pages SET image_path = $1 WHERE id = $2',
          [newPath, page.id]
        );
        
        console.log(`✅ Fixed page ${page.id}: ${oldPath} → ${newPath}`);
      } else {
        console.log(`⚠️  File not found for page ${page.id}: ${filename}`);
      }
    }
    
    // Also fix cover images in books table
    const booksResult = await pool.query(`
      SELECT id, cover_image 
      FROM books 
      WHERE cover_image IS NOT NULL 
      AND cover_image LIKE '/uploads/books/%/%'
    `);
    
    console.log(`📚 Found ${booksResult.rows.length} books with incorrect cover paths`);
    
    for (const book of booksResult.rows) {
      const oldPath = book.cover_image;
      
      // Extract filename from the old path
      const pathParts = oldPath.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // Create new correct path
      const newPath = `/uploads/books/${filename}`;
      
      // Check if file exists
      const fullPath = path.join(uploadsDir, filename);
      const fileExists = await fs.pathExists(fullPath);
      
      if (fileExists) {
        // Update database
        await pool.query(
          'UPDATE books SET cover_image = $1 WHERE id = $2',
          [newPath, book.id]
        );
        
        console.log(`✅ Fixed book ${book.id} cover: ${oldPath} → ${newPath}`);
      } else {
        console.log(`⚠️  Cover file not found for book ${book.id}: ${filename}`);
      }
    }
    
    console.log('🎉 File path fixes completed!');
    
  } catch (error) {
    console.error('❌ Error fixing file paths:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixFilePaths();
