import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

function getPool() {
  try {
    return getDatabase();
  } catch (error) {
    console.error('Database not initialized:', error);
    throw new Error('Database connection not available');
  }
}

const uploadDir = path.join(__dirname, '../uploads/books');
fs.ensureDirSync(uploadDir);

const storage = multer.memoryStorage();
const useSupabaseStorage = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const supabaseBucket = process.env.SUPABASE_BUCKET || 'hkids-books';

function slugify(value) {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'livre';
}

function getStoredFilename(file) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return uniqueSuffix + path.extname(file.originalname);
}

async function persistUploadedFile(file) {
  if (!file) return null;

  const filename = getStoredFilename(file);

  if (useSupabaseStorage) {
    const objectPath = `books/${filename}`;
    const { error } = await supabase.storage
      .from(supabaseBucket)
      .upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('[books] Supabase upload failed:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  const fullPath = path.join(uploadDir, filename);
  await fs.writeFile(fullPath, file.buffer);
  return `/uploads/books/${filename}`;
}

async function removeStoredFile(filePath) {
  if (!filePath) return;

  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    if (!useSupabaseStorage) return;
    try {
      const url = new URL(filePath);
      const marker = `/storage/v1/object/public/${supabaseBucket}/`;
      const markerIndex = url.pathname.indexOf(marker);
      if (markerIndex === -1) return;
      const objectPath = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
      await supabase.storage.from(supabaseBucket).remove([objectPath]);
    } catch (error) {
      console.warn('[books] Could not remove remote file:', error.message);
    }
    return;
  }

  if (!filePath.startsWith('/uploads/books/')) return;
  const localPath = path.join(__dirname, '..', filePath);
  await fs.unlink(localPath).catch(() => {});
}

async function getUniqueSlug(client, title, existingBookId = null) {
  const baseSlug = slugify(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const params = [candidate];
    let query = 'SELECT id FROM books WHERE slug = $1';
    if (existingBookId) {
      params.push(existingBookId);
      query += ' AND id <> $2';
    }

    const result = await client.query(query, params);
    if (result.rowCount === 0) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 51 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|gif|pdf)$/i;
    const allowedMimeTypes = /^(image\/(jpeg|jpg|png|gif)|application\/pdf)$/;

    const extname = allowedExtensions.test(path.extname(file.originalname));
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Only images (JPEG, PNG, GIF) and PDFs are allowed. Received: ${file.mimetype}`));
    }
  },
});

const handleMulterUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();

      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files. Maximum is 50 pages plus one cover.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ error: 'Unexpected file field. Expected: cover or pages.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }

      if (err.message && err.message.includes('File type not allowed')) {
        return res.status(400).json({ error: err.message });
      }

      return res.status(400).json({ error: err.message || 'File upload error' });
    });
  };
};

router.get('/published', async (req, res) => {
  const { age_group, category_id, theme, language, content_type } = req.query;

  const token = req.headers.authorization?.split(' ')[1];
  let kidProfileId = null;

  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'hkids-secret-key-change-in-production';
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'kid' && decoded.kid_profile_id) {
        kidProfileId = decoded.kid_profile_id;
      }
    } catch (err) {
      // Invalid token, continue as public user.
    }
  }

  let query = `
    SELECT b.*, c.name as category_name
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    WHERE b.is_published = TRUE
  `;
  const params = [];
  let index = 1;

  if (kidProfileId) {
    query += ` AND b.category_id IN (
      SELECT category_id FROM parent_approvals
      WHERE kid_profile_id = $${index} AND approved = TRUE
    )`;
    params.push(kidProfileId);
    index += 1;
  }

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

  if (theme) {
    query += ` AND b.theme = $${index}`;
    params.push(theme);
    index += 1;
  }

  if (language) {
    query += ` AND b.language = $${index}`;
    params.push(language);
    index += 1;
  }

  if (content_type) {
    query += ` AND b.content_type = $${index}`;
    params.push(content_type);
    index += 1;
  }

  query += ' ORDER BY b.created_at DESC';

  try {
    const pool = getPool();
    const result = await pool.query(query, params);
    console.log('API response:', { route: 'GET /books/published', count: result.rowCount });
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching published books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    console.log('Book ID:', req.params.id);
    const pool = getPool();
    const isNumericId = /^\d+$/.test(req.params.id);
    const bookResult = await pool.query(
      `SELECT b.*, c.name as category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE ${isNumericId ? 'b.id = $1' : 'b.slug = $1'}`,
      [isNumericId ? Number(req.params.id) : req.params.id]
    );

    const book = bookResult.rows[0];
    console.log('Book loaded:', book);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'hkids-secret-key-change-in-production';
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'kid' && decoded.kid_profile_id) {
          const approvalResult = await pool.query(
            `SELECT 1
             FROM parent_approvals
             WHERE kid_profile_id = $1
               AND category_id = $2
               AND approved = TRUE
             LIMIT 1`,
            [decoded.kid_profile_id, book.category_id]
          );

          if (approvalResult.rows.length === 0) {
            return res.status(403).json({ error: 'This book is not approved for this child' });
          }
        }
      } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    }

    const pagesResult = await pool.query(
      'SELECT * FROM book_pages WHERE book_id = $1 ORDER BY page_number',
      [book.id]
    );

    const story = { ...book, pages: pagesResult.rows };
    console.log('Story loaded:', story);
    console.log('API response:', {
      route: 'GET /books/:id',
      id: book.id,
      slug: book.slug,
      page_count: book.page_count,
      pages_loaded: pagesResult.rowCount,
    });

    res.json(story);
  } catch (err) {
    console.error('Error fetching book:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT b.*, c.name as category_name
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       ORDER BY b.created_at DESC`
    );
    console.log('API response:', { route: 'GET /books', count: result.rowCount });
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/', verifyToken, handleMulterUpload(upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'pages', maxCount: 50 },
])), async (req, res) => {
  const persistedFiles = [];

  try {
    const {
      title,
      author,
      description,
      category_id,
      age_group_min,
      age_group_max,
      is_published,
      content_type = 'story',
      language = 'fr',
      theme,
      audio_url,
      duration_seconds
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const coverFile = req.files?.cover?.[0] || null;
    const pageFiles = req.files?.pages || [];

    if (pageFiles.length === 0) {
      return res.status(400).json({ error: 'At least one page file is required.' });
    }

    console.log('[books] Creating book:', { title, pages: pageFiles.length, storage: useSupabaseStorage ? 'supabase' : 'local' });

    const coverPath = await persistUploadedFile(coverFile);
    if (coverPath) persistedFiles.push(coverPath);

    const pagePaths = [];
    for (const file of pageFiles) {
      const pagePath = await persistUploadedFile(file);
      persistedFiles.push(pagePath);
      pagePaths.push(pagePath);
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const slug = await getUniqueSlug(client, title);
      const insertBook = await client.query(
        `INSERT INTO books (
          title, slug, author, description, cover_image, category_id,
          age_group_min, age_group_max, is_published, file_path, page_count,
          content_type, language, theme, audio_url, duration_seconds
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [
          title,
          slug,
          author || null,
          description || null,
          coverPath,
          category_id || null,
          age_group_min || 0,
          age_group_max || 12,
          is_published === 'true' || is_published === true,
          pagePaths[0] || 'uploaded',
          pagePaths.length,
          content_type || 'story',
          language || 'fr',
          theme || null,
          audio_url || null,
          Math.max(0, Number.parseInt(duration_seconds, 10) || 0),
        ]
      );

      const book = insertBook.rows[0];
      const pageValues = pagePaths.map((pagePath, index) => [book.id, index + 1, pagePath, null]);
      const valuesPlaceholders = pageValues.map((_, i) => {
        const base = i * 4;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      }).join(', ');

      await client.query(
        `INSERT INTO book_pages (book_id, page_number, image_path, content) VALUES ${valuesPlaceholders}`,
        pageValues.flat()
      );

      await client.query('COMMIT');

      console.log('Book loaded:', book);
      console.log('Story loaded:', { ...book, pages: pageValues });
      console.log('API response:', { route: 'POST /books', id: book.id, slug: book.slug, pages: pageValues.length });

      res.status(201).json({
        ...book,
        pages: pageValues.map(([book_id, page_number, image_path, content]) => ({ book_id, page_number, image_path, content })),
        message: 'Book created successfully',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    await Promise.all(persistedFiles.map(removeStoredFile));
    console.error('Error saving book:', err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});

router.put('/:id', verifyToken, handleMulterUpload(upload.fields([
  { name: 'cover', maxCount: 1 },
])), async (req, res) => {
  const {
    title,
    author,
    description,
    category_id,
    age_group_min,
    age_group_max,
    is_published,
    content_type,
    language,
    theme,
    audio_url,
    duration_seconds
  } = req.body;
  let newCoverPath = null;

  console.log('[books] Updating book:', { id: req.params.id, title, category_id, is_published });

  try {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const bookResult = await client.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
      const book = bookResult.rows[0];
      if (!book) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Book not found' });
      }

      const coverFile = req.files?.cover?.[0] || null;
      newCoverPath = coverFile ? await persistUploadedFile(coverFile) : null;
      const coverPath = newCoverPath || book.cover_image;
      const nextTitle = title || book.title;
      const slug = title && title !== book.title
        ? await getUniqueSlug(client, nextTitle, book.id)
        : (book.slug || await getUniqueSlug(client, nextTitle, book.id));

      const updateResult = await client.query(
        `UPDATE books
         SET title = $1, slug = $2, author = $3, description = $4, cover_image = $5,
             category_id = $6, age_group_min = $7, age_group_max = $8,
             is_published = $9, content_type = $10, language = $11, theme = $12,
             audio_url = $13, duration_seconds = $14, updated_at = NOW()
         WHERE id = $15
         RETURNING *`,
        [
          nextTitle,
          slug,
          author !== undefined ? author : book.author,
          description !== undefined ? description : book.description,
          coverPath,
          category_id || book.category_id,
          age_group_min !== undefined ? age_group_min : book.age_group_min,
          age_group_max !== undefined ? age_group_max : book.age_group_max,
          is_published !== undefined
            ? (is_published === 'true' || is_published === true)
            : book.is_published,
          content_type !== undefined ? (content_type || 'story') : book.content_type,
          language !== undefined ? (language || 'fr') : book.language,
          theme !== undefined ? (theme || null) : book.theme,
          audio_url !== undefined ? (audio_url || null) : book.audio_url,
          duration_seconds !== undefined
            ? Math.max(0, Number.parseInt(duration_seconds, 10) || 0)
            : (book.duration_seconds || 0),
          req.params.id,
        ]
      );

      await client.query('COMMIT');
      if (newCoverPath && book.cover_image) await removeStoredFile(book.cover_image);

      console.log('Book loaded:', updateResult.rows[0]);
      console.log('API response:', { route: 'PUT /books/:id', id: req.params.id });
      res.json({ message: 'Book updated successfully', book: updateResult.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      if (newCoverPath) await removeStoredFile(newCoverPath);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const bookResult = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    const book = bookResult.rows[0];

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const pagesResult = await pool.query('SELECT image_path FROM book_pages WHERE book_id = $1', [req.params.id]);
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);

    await removeStoredFile(book.cover_image);
    await Promise.all(pagesResult.rows.map((page) => removeStoredFile(page.image_path)));

    console.log('API response:', { route: 'DELETE /books/:id', id: req.params.id });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
