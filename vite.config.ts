import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    Buffer: 'globalThis.Buffer',
    process: JSON.stringify({
      env: {},
      nextTick: (fn, ...args) => setTimeout(() => fn(...args), 0),
      version: 'v16.0.0',
      browser: true,
      argv: [],
      platform: 'browser',
      cwd: () => '/',
      versions: { node: '16.0.0' }
    }),
    'process.env': '{}',
    'process.nextTick': '(fn, ...args) => setTimeout(() => fn(...args), 0)',
    'process.version': '"v16.0.0"',
    'process.browser': 'true',
  },
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: './src/polyfills/util.js',
      crypto: "crypto-browserify",
      buffer: "buffer",
      url: "url",
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
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