import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: './src/polyfills/util.js',
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          blockchain: ['ethers'],
          supabase: ['@supabase/supabase-js'],
          ai: ['openai']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'ethers', 
      '@supabase/supabase-js',
      'crypto-js',
      'process'
    ]
  },
  server: {
    port: 5173,
    host: true
  }
})