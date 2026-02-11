import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/books');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  }
});

// Get all published books (public)
router.get('/published', (req, res) => {
  const { age_group, category_id } = req.query;
  const db = getDatabase();
  
  let query = `
    SELECT b.*, c.name as category_name 
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.is_published = 1
  `;
  const params = [];

  if (age_group) {
    query += ' AND b.age_group_min <= ? AND b.age_group_max >= ?';
    params.push(age_group, age_group);
  }

  if (category_id) {
    query += ' AND b.category_id = ?';
    params.push(category_id);
  }

  query += ' ORDER BY b.created_at DESC';

  db.all(query, params, (err, books) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Database error' });
    }
    db.close();
    res.json(books);
  });
});

// Get single book (public)
router.get('/:id', (req, res) => {
  const db = getDatabase();
  db.get(
    `SELECT b.*, c.name as category_name 
     FROM books b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.id = ?`,
    [req.params.id],
    (err, book) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }
      if (!book) {
        db.close();
        return res.status(404).json({ error: 'Book not found' });
      }
      
      // Get pages
      db.all(
        'SELECT * FROM book_pages WHERE book_id = ? ORDER BY page_number',
        [req.params.id],
        (err, pages) => {
          db.close();
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ ...book, pages });
        }
      );
    }
  );
});

// Get all books (admin only)
router.get('/', verifyToken, (req, res) => {
  const db = getDatabase();
  db.all(
    `SELECT b.*, c.name as category_name 
     FROM books b
     LEFT JOIN categories c ON b.category_id = c.id
     ORDER BY b.created_at DESC`,
    [],
    (err, books) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(books);
    }
  );
});

// Create book (admin only)
router.post('/', verifyToken, upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pages', maxCount: 50 }
]), async (req, res) => {
  try {
    const { title, author, description, category_id, age_group_min, age_group_max, is_published } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const coverImage = req.files?.cover?.[0]?.filename;
    const pageFiles = req.files?.pages || [];

    console.log(`📚 Création d'un livre: "${title}"`);
    console.log(`📄 Nombre de pages reçues: ${pageFiles.length}`);
    if (pageFiles.length > 0) {
      console.log(`📄 Pages:`, pageFiles.map(f => f.originalname));
    }

    const db = getDatabase();
    
    db.run(
      `INSERT INTO books (title, author, description, cover_image, category_id, age_group_min, age_group_max, is_published, file_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        author || null,
        description || null,
        coverImage ? `/uploads/books/${coverImage}` : null,
        category_id || null,
        age_group_min || 0,
        age_group_max || 12,
        is_published === 'true' || is_published === true ? 1 : 0,
        'uploaded'
      ],
      function(err) {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Database error' });
        }

        const bookId = this.lastID;

        // Insert pages
        if (pageFiles.length > 0) {
          console.log(`💾 Insertion de ${pageFiles.length} pages dans la base de données...`);
          const stmt = db.prepare(
            'INSERT INTO book_pages (book_id, page_number, image_path) VALUES (?, ?, ?)'
          );

          pageFiles.forEach((file, index) => {
            const pagePath = `/uploads/books/${file.filename}`;
            stmt.run(bookId, index + 1, pagePath);
            console.log(`  Page ${index + 1}: ${file.originalname} -> ${pagePath}`);
          });

          stmt.finalize();

          // Update page count
          db.run('UPDATE books SET page_count = ? WHERE id = ?', [pageFiles.length, bookId], (err) => {
            if (err) {
              console.error('Erreur lors de la mise à jour du nombre de pages:', err);
            } else {
              console.log(`✅ ${pageFiles.length} pages insérées avec succès!`);
            }
          });
        } else {
          console.log('⚠️ Aucune page fournie pour ce livre');
        }

        db.close();
        res.status(201).json({ id: bookId, message: 'Book created successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update book (admin only)
router.put('/:id', verifyToken, upload.fields([
  { name: 'cover', maxCount: 1 }
]), (req, res) => {
  const { title, author, description, category_id, age_group_min, age_group_max, is_published } = req.body;
  const db = getDatabase();

  // Get existing book
  db.get('SELECT * FROM books WHERE id = ?', [req.params.id], (err, book) => {
    if (err || !book) {
      db.close();
      return res.status(404).json({ error: 'Book not found' });
    }

    const coverImage = req.files?.cover?.[0]?.filename;
    const coverPath = coverImage ? `/uploads/books/${coverImage}` : book.cover_image;

    db.run(
      `UPDATE books 
       SET title = ?, author = ?, description = ?, cover_image = ?, 
           category_id = ?, age_group_min = ?, age_group_max = ?, 
           is_published = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title || book.title,
        author !== undefined ? author : book.author,
        description !== undefined ? description : book.description,
        coverPath,
        category_id || book.category_id,
        age_group_min !== undefined ? age_group_min : book.age_group_min,
        age_group_max !== undefined ? age_group_max : book.age_group_max,
        is_published !== undefined ? (is_published === 'true' || is_published === true ? 1 : 0) : book.is_published,
        req.params.id
      ],
      (err) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Book updated successfully' });
      }
    );
  });
});

// Delete book (admin only)
router.delete('/:id', verifyToken, (req, res) => {
  const db = getDatabase();
  
  // Get book to delete files
  db.get('SELECT * FROM books WHERE id = ?', [req.params.id], (err, book) => {
    if (err || !book) {
      db.close();
      return res.status(404).json({ error: 'Book not found' });
    }

    // Delete book (cascade will delete pages)
    db.run('DELETE FROM books WHERE id = ?', [req.params.id], (err) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Delete files (optional cleanup)
      if (book.cover_image) {
        const coverPath = path.join(__dirname, '..', book.cover_image);
        fs.unlink(coverPath).catch(() => {}); // Ignore errors
      }

      res.json({ message: 'Book deleted successfully' });
    });
  });
});

export default router;

