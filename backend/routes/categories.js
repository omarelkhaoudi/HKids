import express from 'express';
import { getDatabase } from '../database/init.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Get all categories (public)
router.get('/', (req, res) => {
  const db = getDatabase();
  db.all('SELECT * FROM categories ORDER BY name', [], (err, categories) => {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(categories);
  });
});

// Create category (admin only)
router.post('/', verifyToken, (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const db = getDatabase();
  db.run(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [name, description || null],
    function(err) {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, name, description });
    }
  );
});

// Update category (admin only)
router.put('/:id', verifyToken, (req, res) => {
  const { name, description } = req.body;
  const db = getDatabase();
  
  db.run(
    'UPDATE categories SET name = ?, description = ? WHERE id = ?',
    [name, description, req.params.id],
    function(err) {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ message: 'Category updated successfully' });
    }
  );
});

// Delete category (admin only)
router.delete('/:id', verifyToken, (req, res) => {
  const db = getDatabase();
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
    db.close();
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  });
});

export default router;

