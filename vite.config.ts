import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'buffer'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    Buffer: 'globalThis.Buffer',
  },
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: './src/polyfills/util.js',
      crypto: "crypto-browserify",
      buffer: "buffer",
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
      'process',
      'crypto-browserify',
      'buffer',
      'stream-browserify'
    ]
  },
  server: {
    port: 5173,
    host: true
  }
})