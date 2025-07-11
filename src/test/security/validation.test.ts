import { describe, it, expect } from 'vitest'
import { SecureValidator } from '../../security/validation'

describe('SecureValidator', () => {
  describe('Input Sanitization', () => {
    it('should remove XSS attempts', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<svg onload=alert("XSS")>',
        '<div onclick="alert(\'XSS\')">Click me</div>'
      ]
      
      maliciousInputs.forEach(input => {
        const sanitized = SecureValidator.sanitizeInput(input)
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onerror')
        expect(sanitized).not.toContain('onload')
        expect(sanitized).not.toContain('onclick')
      })
    })

    it('should preserve safe content', () => {
      const safeInputs = [
        'Hello world',
        'user@example.com',
        '1234567890',
        'Safe text with spaces and punctuation!',
        'Multi\nline\ntext'
      ]
      
      safeInputs.forEach(input => {
        const sanitized = SecureValidator.sanitizeInput(input)
        expect(sanitized).toEqual(input.trim())
      })
    })

    it('should handle edge cases', () => {
      expect(SecureValidator.sanitizeInput('')).toEqual('')
      expect(SecureValidator.sanitizeInput('   ')).toEqual('')
      expect(SecureValidator.sanitizeInput('\n\t\r')).toEqual('')
    })

    it('should remove null bytes and control characters', () => {
      const maliciousInput = 'test\x00\x01\x02data'
      const sanitized = SecureValidator.sanitizeInput(maliciousInput)
      expect(sanitized).toEqual('testdata')
    })
  })

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ]
      
      validEmails.forEach(email => {
        expect(SecureValidator.validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..double.dot@example.com',
        'user@.com',
        'user@com',
        'a'.repeat(255) + '@example.com' // Too long
      ]
      
      invalidEmails.forEach(email => {
        expect(SecureValidator.validateEmail(email)).toBe(false)
      })
    })
  })

  describe('Wallet Address Validation', () => {
    it('should validate correct Ethereum addresses', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b8D32C1E23D93b2A3e',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
      ]
      
      validAddresses.forEach(address => {
        expect(SecureValidator.validateWalletAddress(address)).toBe(true)
      })
    })

    it('should reject invalid wallet addresses', () => {
      const invalidAddresses = [
        '742d35Cc6634C0532925a3b8D32C1E23D93b2A3e', // Missing 0x
        '0x742d35Cc6634C0532925a3b8D32C1E23D93b2A3', // Too short
        '0x742d35Cc6634C0532925a3b8D32C1E23D93b2A3ee', // Too long
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // Invalid characters
        ''
      ]
      
      invalidAddresses.forEach(address => {
        expect(SecureValidator.validateWalletAddress(address)).toBe(false)
      })
    })
  })

  describe('Amount Validation', () => {
    it('should validate correct amounts', () => {
      const validAmounts = [0, 1, 100, 1000.5, Number.MAX_SAFE_INTEGER]
      
      validAmounts.forEach(amount => {
        expect(SecureValidator.validateAmount(amount)).toBe(true)
      })
    })

    it('should reject invalid amounts', () => {
      const invalidAmounts = [
        -1,
        NaN,
        Infinity,
        -Infinity,
        Number.MAX_SAFE_INTEGER + 1
      ]
      
      invalidAmounts.forEach(amount => {
        expect(SecureValidator.validateAmount(amount)).toBe(false)
      })
    })
  })

  describe('Email Content Validation', () => {
    it('should detect phishing patterns', () => {
      const phishingContent = [
        'Urgent action required! Your account will be suspended.',
        'Click here immediately to verify your account.',
        'Limited time offer - act now!',
        'Confirm your identity to avoid suspension.',
        'Update your payment information immediately.'
      ]
      
      phishingContent.forEach(content => {
        const result = SecureValidator.validateEmailContent(content)
        expect(result.isValid).toBe(false)
        expect(result.risks).toContain('Potential phishing content detected')
      })
    })

    it('should detect suspicious patterns', () => {
      const suspiciousContent = [
        '<script>alert("xss")</script>',
        'javascript:void(0)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox("xss")'
      ]
      
      suspiciousContent.forEach(content => {
        const result = SecureValidator.validateEmailContent(content)
        expect(result.isValid).toBe(false)
        expect(result.risks).toContain('Suspicious script pattern detected')
      })
    })

    it('should detect excessive links', () => {
      const links = Array(15).fill('https://example.com').join(' ')
      const result = SecureValidator.validateEmailContent(links)
      
      expect(result.isValid).toBe(false)
      expect(result.risks).toContain('Excessive number of links detected')
    })

    it('should detect suspicious domains', () => {
      const suspiciousContent = 'Check out this link: https://suspicious.tk'
      const result = SecureValidator.validateEmailContent(suspiciousContent)
      
      expect(result.isValid).toBe(false)
      expect(result.risks).toContain('Suspicious domains detected')
    })

    it('should pass legitimate content', () => {
      const legitimateContent = 'Welcome to our newsletter! Here are this week\'s updates.'
      const result = SecureValidator.validateEmailContent(legitimateContent)
      
      expect(result.isValid).toBe(true)
      expect(result.risks).toHaveLength(0)
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const data = { name: '', email: 'test@example.com' }
      const rules = {
        name: [{ type: 'required' as const, message: 'Name is required' }],
        email: [{ type: 'required' as const, message: 'Email is required' }]
      }
      
      const result = SecureValidator.validateForm(data, rules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.name).toContain('Name is required')
      expect(result.errors.email).toBeUndefined()
    })

    it('should validate email format', () => {
      const data = { email: 'invalid-email' }
      const rules = {
        email: [{ type: 'email' as const, message: 'Invalid email format' }]
      }
      
      const result = SecureValidator.validateForm(data, rules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.email).toContain('Invalid email format')
    })

    it('should validate numbers', () => {
      const data = { amount: 'not-a-number' }
      const rules = {
        amount: [{ type: 'number' as const, message: 'Must be a number' }]
      }
      
      const result = SecureValidator.validateForm(data, rules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.amount).toContain('Must be a number')
    })

    it('should validate patterns', () => {
      const data = { code: '123' }
      const rules = {
        code: [{
          type: 'pattern' as const,
          pattern: /^\d{6}$/,
          message: 'Code must be 6 digits'
        }]
      }
      
      const result = SecureValidator.validateForm(data, rules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.code).toContain('Code must be 6 digits')
    })

    it('should validate custom rules', () => {
      const data = { password: 'weak' }
      const rules = {
        password: [{
          type: 'custom' as const,
          validator: (value: string) => value.length >= 8,
          message: 'Password must be at least 8 characters'
        }]
      }
      
      const result = SecureValidator.validateForm(data, rules)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.password).toContain('Password must be at least 8 characters')
    })

    it('should pass valid form data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        amount: 100
      }
      const rules = {
        name: [{ type: 'required' as const, message: 'Name is required' }],
        email: [
          { type: 'required' as const, message: 'Email is required' },
          { type: 'email' as const, message: 'Invalid email format' }
        ],
        amount: [{ type: 'number' as const, message: 'Must be a number' }]
      }
      
      const result = SecureValidator.validateForm(data, rules)
      
      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })
  })
})