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
          if (id.includes('/pages/superadmin/') || id.includes('/pages/admin/') || id.includes('/pages/subadmin/')) {
            return 'module-admin';
          }
          if (id.includes('/pages/vendor/')) {
            return 'module-vendor';
          }
          if (id.includes('/pages/b2b/')) {
            return 'module-b2b';
          }
          if (id.includes('/pages/taxi/')) {
            return 'module-taxi';
          }
          if (id.includes('/pages/customer/')) {
            return 'module-customer';
          }
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

