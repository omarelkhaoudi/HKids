/**
 * Build script for backend deployment
 * Prepares the backend for production deployment
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, 'dist');
const SOURCE_DIR = __dirname;

// Files and directories to copy
const COPY_PATTERNS = [
  'server.js',
  'config',
  'database',
  'routes',
  'middleware',
  'utils',
  'uploads',
  'package.json',
  'package-lock.json'
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.env',
  '.git',
  '*.log',
  'dist',
  'test',
  'tests',
  '__tests__'
];

async function build() {
  try {
    console.log('🚀 Starting backend build...');
    
    // Clean build directory
    if (await fs.pathExists(BUILD_DIR)) {
      await fs.remove(BUILD_DIR);
      console.log('✅ Cleaned existing build directory');
    }
    
    // Create build directory
    await fs.ensureDir(BUILD_DIR);
    console.log('✅ Created build directory');
    
    // Copy files
    for (const pattern of COPY_PATTERNS) {
      const sourcePath = path.join(SOURCE_DIR, pattern);
      const destPath = path.join(BUILD_DIR, pattern);
      
      if (await fs.pathExists(sourcePath)) {
        const stat = await fs.stat(sourcePath);
        
        if (stat.isDirectory()) {
          await fs.copy(sourcePath, destPath, {
            filter: (src) => {
              const relativePath = path.relative(SOURCE_DIR, src);
              return !EXCLUDE_PATTERNS.some(exclude => 
                relativePath.includes(exclude) || 
                relativePath.match(new RegExp(exclude.replace('*', '.*')))
              );
            }
          });
          console.log(`✅ Copied directory: ${pattern}`);
        } else {
          await fs.copy(sourcePath, destPath);
          console.log(`✅ Copied file: ${pattern}`);
        }
      } else {
        console.log(`⚠️  File/directory not found: ${pattern}`);
      }
    }
    
    // Create .env.example if .env exists
    const envPath = path.join(SOURCE_DIR, '.env');
    const envExamplePath = path.join(BUILD_DIR, '.env.example');
    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf-8');
      // Remove sensitive values
      const exampleContent = envContent
        .split('\n')
        .map(line => {
          if (line.trim() && !line.startsWith('#')) {
            const [key] = line.split('=');
            return key ? `${key}=` : line;
          }
          return line;
        })
        .join('\n');
      await fs.writeFile(envExamplePath, exampleContent);
      console.log('✅ Created .env.example');
    }
    
    console.log('\n✅ Backend build completed successfully!');
    console.log(`📦 Build output: ${BUILD_DIR}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Copy the dist folder to your server');
    console.log('   2. Run: npm install --production');
    console.log('   3. Create .env file with your configuration');
    console.log('   4. Run: npm start');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

