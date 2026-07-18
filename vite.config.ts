import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Never wipe dist on build: user-uploaded images live in dist/uploads and
    // are NOT in git. vite empties outDir by default (it's inside the project
    // root), which deletes them. build.sh does its own clean that preserves
    // dist/uploads, so leave any emptying to it.
    emptyOutDir: false
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
