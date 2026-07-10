import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('pdfjs-dist') || id.includes('tesseract.js')) return 'heavy';
          if (id.includes('@capacitor')) return 'capacitor';
          if (id.includes('framer-motion')) return 'motion';
          if (
            id.includes('react-dom')
            || id.includes('react-router')
            || id.includes('/react/')
            || id.includes('lucide-react')
            || id.includes('scheduler')
            || id.includes('use-sync-external-store')
          ) {
            return 'react';
          }
          return 'vendor';
        }
      }
    }
  }
});
