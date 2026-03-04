import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';

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

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: `Error fetching categories: ${err.message || 'Unknown error'}` });
  }
});

// Create category (admin only)
router.post('/', verifyToken, async (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description',
      [name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: `Error creating category: ${err.message || 'Unknown error'}` });
  }
});

// Update category (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  const { name, description } = req.body;

  try {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING id',
      [name, description, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: `Error updating category: ${err.message || 'Unknown error'}` });
  }
});

// Delete category (admin only)
router.delete('/:id', verifyToken, async (req, res, next) => {
  let pool;
  try {
    console.log('=== DELETE CATEGORY REQUEST ===');
    console.log('Category ID:', req.params.id);
    console.log('User ID:', req.user?.id);
    console.log('Username:', req.user?.username);
    console.log('Role:', req.user?.role);
    console.log('Auth header:', req.headers.authorization ? 'present' : 'missing');
    
    // Get database pool
    try {
      pool = getPool();
      console.log('Database pool obtained successfully');
    } catch (dbError) {
      console.error('=== DATABASE CONNECTION ERROR ===');
      console.error('Error:', dbError);
      console.error('Error message:', dbError.message);
      console.error('Error stack:', dbError.stack);
      return res.status(500).json({ 
        error: `Database connection failed: ${dbError.message || 'Unable to connect to database'}` 
      });
    }
    
    // Validate category ID
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) {
      console.log('Invalid category ID:', req.params.id);
      return res.status(400).json({ error: `Invalid category ID: ${req.params.id}` });
    }
    
    console.log('Validated category ID:', categoryId);
    
    // Check if category exists
    let categoryCheck;
    try {
      console.log('Checking if category exists...');
      categoryCheck = await pool.query(
        'SELECT id, name FROM categories WHERE id = $1',
        [categoryId]
      );
      console.log('Category check result:', categoryCheck.rows.length > 0 ? 'found' : 'not found');
    } catch (queryError) {
      console.error('=== ERROR CHECKING CATEGORY ===');
      console.error('Error:', queryError);
      console.error('Error code:', queryError.code);
      console.error('Error message:', queryError.message);
      console.error('Error detail:', queryError.detail);
      return res.status(500).json({ 
        error: `Database query error: ${queryError.message || 'Unknown error'}` 
      });
    }
    
    if (categoryCheck.rows.length === 0) {
      console.log('Category not found:', categoryId);
      return res.status(404).json({ error: `Category with ID ${categoryId} not found` });
    }
    
    console.log('Category found:', categoryCheck.rows[0].name);
    
    // Check if category is being used by any books
    let booksCheck;
    try {
      console.log('Checking if category is used by books...');
      booksCheck = await pool.query(
        'SELECT COUNT(*) as count FROM books WHERE category_id = $1',
        [categoryId]
      );
      console.log('Books check completed');
    } catch (queryError) {
      console.error('=== ERROR CHECKING BOOKS ===');
      console.error('Error:', queryError);
      console.error('Error code:', queryError.code);
      console.error('Error message:', queryError.message);
      console.error('Error detail:', queryError.detail);
      return res.status(500).json({ 
        error: `Database query error: ${queryError.message || 'Unknown error'}` 
      });
    }
    
    const bookCount = parseInt(booksCheck.rows[0].count);
    console.log('Books using this category:', bookCount);
    
    if (bookCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category "${categoryCheck.rows[0].name}": it is being used by ${bookCount} book(s). Please remove or reassign books first.` 
      });
    }
    
    // Delete the category
    let result;
    try {
      console.log('Attempting to delete category...');
      result = await pool.query(
        'DELETE FROM categories WHERE id = $1',
        [categoryId]
      );
      console.log('Delete query executed, rows affected:', result.rowCount);
    } catch (deleteError) {
      console.error('=== ERROR DELETING CATEGORY ===');
      console.error('Error:', deleteError);
      console.error('Error code:', deleteError.code);
      console.error('Error message:', deleteError.message);
      console.error('Error detail:', deleteError.detail);
      console.error('Error constraint:', deleteError.constraint);
      
      // Check for foreign key constraint violation
      if (deleteError.code === '23503' || deleteError.message?.includes('foreign key constraint') || deleteError.constraint) {
        return res.status(400).json({ 
          error: 'Cannot delete category: it is being used by one or more books. Please remove or reassign books first.' 
        });
      }
      
      return res.status(500).json({ 
        error: `Database error while deleting: ${deleteError.message || 'Unknown error'}` 
      });
    }

    if (result.rowCount === 0) {
      console.log('No rows deleted (category not found)');
      return res.status(404).json({ error: `Category with ID ${categoryId} not found` });
    }

    console.log('=== CATEGORY DELETED SUCCESSFULLY ===');
    console.log('Category ID:', categoryId);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('=== UNEXPECTED ERROR ===');
    console.error('Error:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      detail: err.detail,
      name: err.name,
      constraint: err.constraint
    });
    
    // Ensure we always return a specific error message, never generic "Database error"
    let errorMessage = 'An unexpected error occurred while deleting the category';
    
    if (err.message && !err.message.toLowerCase().includes('database error')) {
      errorMessage = err.message;
    } else if (err.code) {
      errorMessage = `Database operation failed (code: ${err.code})`;
    } else if (err.name) {
      errorMessage = `Error: ${err.name}`;
    }
    
    console.error('Returning specific error:', errorMessage);
    
    // Return error directly with specific message
    return res.status(500).json({ 
      error: errorMessage
    });
  }
});

export default router;

