import { getDatabase } from '../database/init.js';

const pool = getDatabase();
const learning = await pool.query("SELECT count(*)::int AS c FROM learning_contents WHERE status = 'published'");
const books = await pool.query('SELECT count(*)::int AS c FROM books WHERE is_published = true');
const categories = await pool.query('SELECT count(*)::int AS c FROM categories');
console.log(JSON.stringify({
  learning_published: learning.rows[0].c,
  books_published: books.rows[0].c,
  categories: categories.rows[0].c,
}));
