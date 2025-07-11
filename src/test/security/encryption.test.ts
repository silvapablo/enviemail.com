import { describe, it, expect, beforeEach } from 'vitest'
import { EncryptionManager } from '../../security/encryption'

describe('EncryptionManager', () => {
  let encryptionManager: typeof EncryptionManager
  
  beforeEach(() => {
    encryptionManager = EncryptionManager
  })

  describe('Key Generation', () => {
    it('should generate unique keys', () => {
      const key1 = encryptionManager.generateKey()
      const key2 = encryptionManager.generateKey()
      
      expect(key1).not.toEqual(key2)
      expect(key1).toHaveLength(64) // 32 bytes * 2 (hex)
      expect(key2).toHaveLength(64)
    })

    it('should generate cryptographically secure random values', () => {
      const random1 = encryptionManager.secureRandom(16)
      const random2 = encryptionManager.secureRandom(16)
      
      expect(random1).not.toEqual(random2)
      expect(random1).toHaveLength(32) // 16 bytes * 2 (hex)
    })
  })

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const testData = 'sensitive user data'
      const key = encryptionManager.generateKey()
      
      const encrypted = encryptionManager.encrypt(testData, key)
      const decrypted = encryptionManager.decrypt(encrypted, key)
      
      expect(decrypted).toEqual(testData)
      expect(encrypted).not.toContain(testData)
    })

    it('should produce different ciphertext for same plaintext', () => {
      const testData = 'same data'
      const key = encryptionManager.generateKey()
      
      const encrypted1 = encryptionManager.encrypt(testData, key)
      const encrypted2 = encryptionManager.encrypt(testData, key)
      
      expect(encrypted1).not.toEqual(encrypted2)
      expect(encryptionManager.decrypt(encrypted1, key)).toEqual(testData)
      expect(encryptionManager.decrypt(encrypted2, key)).toEqual(testData)
    })

    it('should fail with wrong key', () => {
      const testData = 'secret data'
      const key1 = encryptionManager.generateKey()
      const key2 = encryptionManager.generateKey()
      
      const encrypted = encryptionManager.encrypt(testData, key1)
      
      expect(() => {
        encryptionManager.decrypt(encrypted, key2)
      }).toThrow()
    })

    it('should handle complex data structures', () => {
      const testData = JSON.stringify({
        user: 'test@example.com',
        balance: 150000,
        transactions: [1, 2, 3],
        metadata: { created: Date.now() }
      })
      const key = encryptionManager.generateKey()
      
      const encrypted = encryptionManager.encrypt(testData, key)
      const decrypted = encryptionManager.decrypt(encrypted, key)
      
      expect(JSON.parse(decrypted)).toEqual(JSON.parse(testData))
    })
  })

  describe('Hashing', () => {
    it('should produce consistent hashes', () => {
      const data = 'test data'
      const hash1 = encryptionManager.hash(data)
      const hash2 = encryptionManager.hash(data)
      
      expect(hash1).toEqual(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 hex
    })

    it('should produce different hashes for different data', () => {
      const hash1 = encryptionManager.hash('data1')
      const hash2 = encryptionManager.hash('data2')
      
      expect(hash1).not.toEqual(hash2)
    })
  })

  describe('HMAC Signatures', () => {
    it('should generate and verify signatures', () => {
      const data = 'important data'
      const key = encryptionManager.generateKey()
      
      const signature = encryptionManager.hmac(data, key)
      const isValid = encryptionManager.verifySignature(data, signature, key)
      
      expect(isValid).toBe(true)
      expect(signature).toHaveLength(64) // HMAC-SHA256 hex
    })

    it('should detect tampered data', () => {
      const data = 'important data'
      const tamperedData = 'tampered data'
      const key = encryptionManager.generateKey()
      
      const signature = encryptionManager.hmac(data, key)
      const isValid = encryptionManager.verifySignature(tamperedData, signature, key)
      
      expect(isValid).toBe(false)
    })

    it('should work with complex objects', () => {
      const data = { user: 'test', amount: 1000, timestamp: Date.now() }
      const key = encryptionManager.generateKey()
      
      const signature = encryptionManager.generateSignature(data, key)
      const isValid = encryptionManager.verifySignature(data, signature, key)
      
      expect(isValid).toBe(true)
    })
  })

  describe('Security Properties', () => {
    it('should not leak information through timing', () => {
      const key = encryptionManager.generateKey()
      const data1 = 'a'
      const data2 = 'a'.repeat(1000)
      
      const start1 = performance.now()
      encryptionManager.encrypt(data1, key)
      const time1 = performance.now() - start1
      
      const start2 = performance.now()
      encryptionManager.encrypt(data2, key)
      const time2 = performance.now() - start2
      
      // Times should be relatively similar (within 10x)
      expect(time2 / time1).toBeLessThan(10)
    })

    it('should handle edge cases gracefully', () => {
      const key = encryptionManager.generateKey()
      
      // Empty string
      const encrypted = encryptionManager.encrypt('', key)
      const decrypted = encryptionManager.decrypt(encrypted, key)
      expect(decrypted).toEqual('')
      
      // Unicode characters
      const unicode = '🔐🚀💎'
      const encryptedUnicode = encryptionManager.encrypt(unicode, key)
      const decryptedUnicode = encryptionManager.decrypt(encryptedUnicode, key)
      expect(decryptedUnicode).toEqual(unicode)
    })
  })
})