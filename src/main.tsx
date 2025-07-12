import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Buffer } from 'buffer'

// Make Buffer available globally for polyfills
globalThis.Buffer = Buffer


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);