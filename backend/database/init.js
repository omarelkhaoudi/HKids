import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/hkids.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
fs.ensureDirSync(dbDir);

export function getDatabase() {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    }
  });
}

export function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();

    // Create tables
    db.serialize(() => {
      // Users table (for admin)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          db.close();
          return reject(err);
        }
      });

      // Categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating categories table:', err);
          db.close();
          return reject(err);
        }
      });

      // Books table
      db.run(`
        CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          author TEXT,
          description TEXT,
          cover_image TEXT,
          file_path TEXT NOT NULL,
          category_id INTEGER,
          age_group_min INTEGER DEFAULT 0,
          age_group_max INTEGER DEFAULT 12,
          page_count INTEGER DEFAULT 0,
          is_published INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating books table:', err);
          db.close();
          return reject(err);
        }
      });

      // Book pages table (for storing page images/content)
      db.run(`
        CREATE TABLE IF NOT EXISTS book_pages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          page_number INTEGER NOT NULL,
          image_path TEXT,
          content TEXT,
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating book_pages table:', err);
          db.close();
          return reject(err);
        }
      });

      // Create default categories first
      const defaultCategories = [
        { name: 'Fiction', description: 'Fictional stories and tales' },
        { name: 'Educational', description: 'Educational content' },
        { name: 'Adventure', description: 'Adventure stories' },
        { name: 'Animals', description: 'Stories about animals' }
      ];

      let categoriesProcessed = 0;
      const totalCategories = defaultCategories.length;

      defaultCategories.forEach((cat) => {
        db.run(
          `INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)`,
          [cat.name, cat.description],
          function(err) {
            categoriesProcessed++;
            if (err) {
              console.error(`Error creating category ${cat.name}:`, err);
            }
            
            // After all categories are processed, create admin user
            if (categoriesProcessed === totalCategories) {
              // Create default admin user
              const defaultPassword = bcrypt.hashSync('admin123', 10);
              db.run(
                `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
                ['admin', defaultPassword, 'admin'],
                function(err) {
                  if (err && !err.message.includes('UNIQUE constraint')) {
                    console.error('Error creating default admin:', err);
                    db.close();
                    return reject(err);
                  } else {
                    if (this.changes > 0) {
                      console.log('✅ Default admin user created (username: admin, password: admin123)');
                    } else {
                      console.log('✅ Default admin user already exists');
                    }
                    
                    console.log('✅ Database tables created');
                    db.close((err) => {
                      if (err) {
                        console.error('Error closing database:', err);
                        return reject(err);
                      }
                      resolve();
                    });
                  }
                }
              );
            }
          }
        );
      });
    });
  });
}

