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

// Helper function to get database pool safely
function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

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
router.get('/published', async (req, res) => {
  const { age_group, category_id } = req.query;

  let query = `
    SELECT b.*, c.name as category_name 
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.is_published = TRUE
  `;
  const params = [];
  let index = 1;

  if (age_group) {
    query += ` AND b.age_group_min <= $${index} AND b.age_group_max >= $${index + 1}`;
    params.push(age_group, age_group);
    index += 2;
  }

  if (category_id) {
    query += ` AND b.category_id = $${index}`;
    params.push(category_id);
    index += 1;
  }

  query += ' ORDER BY b.created_at DESC';

  try {
    const pool = getPool();
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching published books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single book (public)
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const bookResult = await pool.query(
      `SELECT b.*, c.name as category_name 
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    const book = bookResult.rows[0];
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const pagesResult = await pool.query(
      'SELECT * FROM book_pages WHERE book_id = $1 ORDER BY page_number',
      [req.params.id]
    );

    res.json({ ...book, pages: pagesResult.rows });
  } catch (err) {
    console.error('Error fetching book:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all books (admin only)
router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT b.*, c.name as category_name 
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Database error' });
  }
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

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertBook = await client.query(
        `INSERT INTO books (title, author, description, cover_image, category_id, age_group_min, age_group_max, is_published, file_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          title,
          author || null,
          description || null,
          coverImage ? `/uploads/books/${coverImage}` : null,
          category_id || null,
          age_group_min || 0,
          age_group_max || 12,
          is_published === 'true' || is_published === true,
          'uploaded',
        ]
      );

      const bookId = insertBook.rows[0].id;

      if (pageFiles.length > 0) {
        console.log(`💾 Insertion de ${pageFiles.length} pages dans la base de données...`);
        for (let index = 0; index < pageFiles.length; index++) {
          const file = pageFiles[index];
          const pagePath = `/uploads/books/${file.filename}`;
          await client.query(
            'INSERT INTO book_pages (book_id, page_number, image_path) VALUES ($1, $2, $3)',
            [bookId, index + 1, pagePath]
          );
          console.log(`  Page ${index + 1}: ${file.originalname} -> ${pagePath}`);
        }

        await client.query(
          'UPDATE books SET page_count = $1 WHERE id = $2',
          [pageFiles.length, bookId]
        );
        console.log(`✅ ${pageFiles.length} pages insérées avec succès!`);
      } else {
        console.log('⚠️ Aucune page fournie pour ce livre');
      }

      await client.query('COMMIT');
      res.status(201).json({ id: bookId, message: 'Book created successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error saving book:', err);
      res.status(500).json({ error: 'Database error' });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update book (admin only)
router.put('/:id', verifyToken, upload.fields([
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  const { title, author, description, category_id, age_group_min, age_group_max, is_published } = req.body;

  try {
    const pool = getPool();
    const bookResult = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    const book = bookResult.rows[0];

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const coverImage = req.files?.cover?.[0]?.filename;
    const coverPath = coverImage ? `/uploads/books/${coverImage}` : book.cover_image;

    await pool.query(
      `UPDATE books 
       SET title = $1, author = $2, description = $3, cover_image = $4,
           category_id = $5, age_group_min = $6, age_group_max = $7,
           is_published = $8, updated_at = NOW()
       WHERE id = $9`,
      [
        title || book.title,
        author !== undefined ? author : book.author,
        description !== undefined ? description : book.description,
        coverPath,
        category_id || book.category_id,
        age_group_min !== undefined ? age_group_min : book.age_group_min,
        age_group_max !== undefined ? age_group_max : book.age_group_max,
        is_published !== undefined
          ? (is_published === 'true' || is_published === true)
          : book.is_published,
        req.params.id,
      ]
    );

    res.json({ message: 'Book updated successfully' });
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete book (admin only)
router.delete('/:id', verifyToken, (req, res) => {
  (async () => {
    try {
      const pool = getPool();
      const bookResult = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
      const book = bookResult.rows[0];

      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);

      if (book.cover_image) {
        const coverPath = path.join(__dirname, '..', book.cover_image);
        fs.unlink(coverPath).catch(() => {});
      }

      res.json({ message: 'Book deleted successfully' });
    } catch (err) {
      console.error('Error deleting book:', err);
      res.status(500).json({ error: 'Database error' });
    }
  })();
});

export default router;

