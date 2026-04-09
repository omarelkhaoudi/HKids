import { getDatabase } from './database/init.js';

async function checkBook() {
  try {
    const pool = getDatabase();
    const result = await pool.query('SELECT * FROM books WHERE id = 2');
    console.log('Book ID 2:', result.rows[0]);
    const pages = await pool.query('SELECT * FROM book_pages WHERE book_id = 2 ORDER BY page_number');
    console.log('Pages:', pages.rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBook();
