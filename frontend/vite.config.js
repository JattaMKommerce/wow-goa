import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('bootstrap') || id.includes('axios')) {
              return 'vendor-ui';
            }
            return 'vendor-libs';
          }
          // App pages are NOT grouped here on purpose: App.jsx lazy-loads each page,
          // and grouping whole folders would force them all to download up front.
        }
      }
    }
  },
  server: {
    watch: {
      ignored: ['**/dist/**', '**/.git/**', '**/backend/**']
    },
    proxy: {
      '/backend/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})

