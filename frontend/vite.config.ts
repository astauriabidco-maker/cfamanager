import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Needed for Docker
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://backend:8000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // Depends if backend expects /api prefix or not.
        // FastAPI router often has prefix like /auth, /candidats.
        // If frontend calls /api/auth/login, and backend is at /auth/login, we need rewrite.
        // Let's assume standard practice: if backend routes are root-level (e.g. /auth), we rewrite.
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
