import { getDatabase } from '../database/init.js';
import bcrypt from 'bcryptjs';

const db = getDatabase();

// Reset admin user
const defaultPassword = bcrypt.hashSync('admin123', 10);

db.run(
  `DELETE FROM users WHERE username = 'admin'`,
  (err) => {
    if (err) {
      console.error('Error deleting admin user:', err);
      db.close();
      process.exit(1);
    }
    
    db.run(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
      ['admin', defaultPassword, 'admin'],
      (err) => {
        if (err) {
          console.error('Error creating admin user:', err);
          db.close();
          process.exit(1);
        }
        
        console.log('✅ Admin user reset successfully');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        db.close();
        process.exit(0);
      }
    );
  }
);

