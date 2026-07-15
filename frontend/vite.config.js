import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget =
    env.VITE_API_URL?.replace(/\/+$/, '')
    || `http://localhost:${env.PORT || '3000'}`;

  return {
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'es2020',
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/src/pages/Subscriptions')) return 'subscriptions';
          if (id.includes('pdfjs-dist') || id.includes('tesseract.js')) return 'heavy';
          if (id.includes('@capacitor')) return 'capacitor';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('/src/components/kids/VoiceAssistant') || id.includes('/src/api/ai')) return 'assistant';
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
  };
});
