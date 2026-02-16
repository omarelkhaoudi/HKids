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
    res.status(500).json({ error: 'Database error' });
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
    res.status(500).json({ error: 'Database error' });
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
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete category (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM categories WHERE id = $1',
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;

