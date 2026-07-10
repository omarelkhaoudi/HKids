import { getDatabase, initDatabase } from '../database/init.js';
import bcrypt from 'bcryptjs';

const username = process.env.ADMIN_RESET_USERNAME || 'admin';
const password = process.env.ADMIN_RESET_PASSWORD;

if (!password || password.length < 12) {
  console.error('ADMIN_RESET_PASSWORD with at least 12 characters is required.');
  process.exit(1);
}

try {
  await initDatabase();
  const db = getDatabase();
  const passwordHash = await bcrypt.hash(password, 12);
  await db.query(
    `INSERT INTO users (username, password, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (username)
     DO UPDATE SET password = EXCLUDED.password, role = 'admin'`,
    [username, passwordHash]
  );
  console.log(`Admin credentials reset for ${username}.`);
  await db.end();
} catch (error) {
  console.error('Could not reset admin credentials:', error.message);
  process.exitCode = 1;
}
  }
);

