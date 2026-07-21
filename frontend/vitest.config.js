import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.js'],
    testTimeout: 15000,
    include: ['src/**/*.test.{js,jsx}'],
    env: {
      VITE_API_URL: 'http://localhost:3000'
    }
  }
});
