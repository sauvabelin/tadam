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
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Split the markdown/unified ecosystem (react-markdown + micromark +
        // remark/rehype/hast/mdast/unist) out of the main bundle. It's used by
        // the eagerly-loaded BubbleContent, so it can't be deferred, but as its
        // own chunk it keeps every chunk under the 500 kB warning threshold and
        // lets the browser fetch it in parallel with the app shell.
        manualChunks(id: string) {
          if (
            /node_modules\/(react-markdown|rehype|remark|micromark|hast|mdast|unist|property-information|space-separated-tokens|comma-separated-tokens|character-entities|decode-named-character-reference|vfile|bail|trough|unified|devlop|zwitch|html-url-attributes|estree|hastscript|web-namespaces)/.test(
              id
            )
          ) {
            return 'markdown'
          }
        },
      },
    },
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
