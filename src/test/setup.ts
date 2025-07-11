import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web Crypto API
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    subtle: {
      generateKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn()
    }
  }
})

// Mock IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null
}

const mockIDBDatabase = {
  transaction: vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      put: vi.fn().mockReturnValue(mockIDBRequest),
      get: vi.fn().mockReturnValue(mockIDBRequest),
      getAll: vi.fn().mockReturnValue(mockIDBRequest),
      index: vi.fn().mockReturnValue({
        getAll: vi.fn().mockReturnValue(mockIDBRequest),
        openCursor: vi.fn().mockReturnValue(mockIDBRequest)
      })
    })
  }),
  createObjectStore: vi.fn().mockReturnValue({
    createIndex: vi.fn()
  }),
  objectStoreNames: {
    contains: vi.fn().mockReturnValue(false)
  }
}

Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn().mockReturnValue({
      ...mockIDBRequest,
      result: mockIDBDatabase,
      onupgradeneeded: null
    })
  }
})

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1,
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null
}))

// Mock Performance Observer
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}))