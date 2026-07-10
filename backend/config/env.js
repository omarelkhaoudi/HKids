/**
 * Environment Configuration
 * Validates and exports environment variables
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

/**
 * Validates required environment variables
 */
const validateEnv = () => {
  if (process.env.NODE_ENV === 'test') {
    process.env.JWT_SECRET ||= 'hkids-test-jwt-secret-with-32-characters-minimum';
    return;
  }

  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Refuse weak signing configuration in production.
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET || '';
    if (
      jwtSecret === 'hkids-secret-key-change-in-production'
      || jwtSecret.length < 32
    ) {
      throw new Error('JWT_SECRET must be a unique secret of at least 32 characters in production');
    }
  }
};

// Validate on load
validateEnv();

/**
 * Environment configuration
 */
export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'hkids-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'https://hkids.vercel.app',
  
  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // Rate Limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
};

export default config;

