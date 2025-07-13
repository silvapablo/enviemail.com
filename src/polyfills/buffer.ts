import { Buffer } from 'buffer';

// Make Buffer available globally before any other modules load
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Also make it available as a global for modules that expect it
global.Buffer = Buffer;