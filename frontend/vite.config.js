import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Gzip Compression
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      filter: /\.(js|mjs|json|css|html)$/i,
      threshold: 1024,
    }),
    // Brotli Compression (biasanya lebih kecil 15-20% dari gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      filter: /\.(js|mjs|json|css|html)$/i,
      threshold: 1024,
    })
  ],
  resolve: {
    preserveSymlinks: true
  },
  // Optimasi Build
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('axios')) {
              return 'vendor-axios'
            }
            // Pecah library lain ke vendor umum
            return 'vendor'
          }
        }
      }
    }
  },
  esbuild: {
    // Hapus console.log di production untuk menghemat sedikit size
    drop: ['console', 'debugger'],
  },
  server: {
    allowedHosts: ['agricareer.site'],
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
