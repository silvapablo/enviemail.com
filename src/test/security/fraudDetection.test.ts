import { describe, it, expect, beforeEach } from 'vitest'
import { FraudDetectionEngine } from '../../security/fraudDetection'
import { SecureTransaction } from '../../security/types'

describe('FraudDetectionEngine', () => {
  let mockTransaction: SecureTransaction
  let mockHistory: SecureTransaction[]
  
  beforeEach(() => {
    const baseTime = Date.now()
    
    mockTransaction = {
      id: 'test-tx-1',
      hash: 'hash123',
      timestamp: baseTime,
      type: 'stake',
      amount: 1000,
      from: 'user1',
      to: 'contract1',
      gasUsed: 21000,
      status: 'pending',
      signature: 'sig123',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      blockNumber: 12345,
      confirmations: 0,
      securityScore: 0,
      riskFlags: []
    }
    
    mockHistory = [
      {
        ...mockTransaction,
        id: 'tx-1',
        timestamp: baseTime - 3600000, // 1 hour ago
        amount: 500
      },
      {
        ...mockTransaction,
        id: 'tx-2',
        timestamp: baseTime - 7200000, // 2 hours ago
        amount: 750
      }
    ]
  })

  describe('Velocity Analysis', () => {
    it('should detect high transaction frequency', async () => {
      const recentHistory = Array.from({ length: 15 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        timestamp: Date.now() - (i * 60000) // Every minute
      }))
      
      const result = await FraudDetectionEngine.analyzeTransaction(mockTransaction, recentHistory)
      
      expect(result.riskScore).toBeGreaterThan(20)
      expect(result.flags).toContain('High transaction frequency detected')
    })

    it('should detect high amount velocity', async () => {
      const highAmountHistory = Array.from({ length: 5 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        timestamp: Date.now() - (i * 300000), // Every 5 minutes
        amount: 25000 // High amounts
      }))
      
      const result = await FraudDetectionEngine.analyzeTransaction(
        { ...mockTransaction, amount: 25000 },
        highAmountHistory
      )
      
      expect(result.riskScore).toBeGreaterThan(25)
      expect(result.flags).toContain('High amount velocity detected')
    })

    it('should detect too many unique recipients', async () => {
      const multiRecipientHistory = Array.from({ length: 60 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        timestamp: Date.now() - (i * 3600000), // Every hour for 60 hours
        to: `recipient-${i}`
      }))
      
      const result = await FraudDetectionEngine.analyzeTransaction(mockTransaction, multiRecipientHistory)
      
      expect(result.riskScore).toBeGreaterThan(15)
      expect(result.flags).toContain('Too many unique recipients')
    })
  })

  describe('Amount Analysis', () => {
    it('should detect unusually large amounts', async () => {
      const normalHistory = Array.from({ length: 10 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        amount: 100 // Normal amounts
      }))
      
      const result = await FraudDetectionEngine.analyzeTransaction(
        { ...mockTransaction, amount: 10000 }, // 100x larger
        normalHistory
      )
      
      expect(result.riskScore).toBeGreaterThan(20)
      expect(result.flags).toContain('Amount significantly higher than average')
    })

    it('should detect suspicious round numbers', async () => {
      const result = await FraudDetectionEngine.analyzeTransaction(
        { ...mockTransaction, amount: 50000 }, // Round number
        mockHistory
      )
      
      expect(result.riskScore).toBeGreaterThan(5)
      expect(result.flags).toContain('Suspicious round number amount')
    })

    it('should handle new users appropriately', async () => {
      const result = await FraudDetectionEngine.analyzeTransaction(mockTransaction, [])
      
      expect(result.flags).toContain('New user - limited history')
      expect(result.riskScore).toBeGreaterThan(0)
    })
  })

  describe('Pattern Analysis', () => {
    it('should detect repeated exact amounts', async () => {
      const repeatedAmountHistory = Array.from({ length: 8 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        amount: 1000 // Same amount
      }))
      
      const result = await FraudDetectionEngine.analyzeTransaction(
        { ...mockTransaction, amount: 1000 },
        repeatedAmountHistory
      )
      
      expect(result.riskScore).toBeGreaterThan(10)
      expect(result.flags).toContain('Repeated exact amounts detected')
    })

    it('should detect automated transaction patterns', async () => {
      const baseTime = Date.now()
      const automatedHistory = Array.from({ length: 6 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        timestamp: baseTime - (i * 60000) // Exactly every minute
      }))
      
      const result = await FraudDetectionEngine.analyzeTransaction(mockTransaction, automatedHistory)
      
      expect(result.riskScore).toBeGreaterThan(15)
      expect(result.flags).toContain('Automated transaction pattern detected')
    })
  })

  describe('Geographic Analysis', () => {
    it('should detect IP jumping', async () => {
      const multiIPHistory = Array.from({ length: 10 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        ipAddress: `192.168.1.${i}` // Different IPs
      }))
      
      const result = await FraudDetectionEngine.analyzeTransaction(mockTransaction, multiIPHistory)
      
      expect(result.riskScore).toBeGreaterThan(10)
      expect(result.flags).toContain('Multiple IP addresses detected')
    })

    it('should detect VPN/Proxy usage', async () => {
      const vpnTransaction = {
        ...mockTransaction,
        ipAddress: '10.0.0.1' // Private IP range (VPN indicator)
      }
      
      const result = await FraudDetectionEngine.analyzeTransaction(vpnTransaction, mockHistory)
      
      expect(result.riskScore).toBeGreaterThan(5)
      expect(result.flags).toContain('VPN or proxy usage detected')
    })
  })

  describe('Timing Analysis', () => {
    it('should detect unusual hours', async () => {
      const nightTransaction = {
        ...mockTransaction,
        timestamp: new Date('2024-01-01T03:00:00Z').getTime() // 3 AM
      }
      
      const result = await FraudDetectionEngine.analyzeTransaction(nightTransaction, mockHistory)
      
      expect(result.riskScore).toBeGreaterThan(5)
      expect(result.flags).toContain('Transaction during unusual hours')
    })

    it('should detect high weekend activity', async () => {
      const weekendHistory = Array.from({ length: 10 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        timestamp: new Date('2024-01-06T12:00:00Z').getTime() + (i * 3600000) // Saturday
      }))
      
      const weekendTransaction = {
        ...mockTransaction,
        timestamp: new Date('2024-01-07T12:00:00Z').getTime() // Sunday
      }
      
      const result = await FraudDetectionEngine.analyzeTransaction(weekendTransaction, weekendHistory)
      
      expect(result.flags).toContain('High weekend activity pattern')
    })
  })

  describe('Risk Scoring', () => {
    it('should calculate appropriate risk scores', async () => {
      const lowRiskResult = await FraudDetectionEngine.analyzeTransaction(mockTransaction, mockHistory)
      expect(lowRiskResult.riskScore).toBeLessThan(30)
      
      const highRiskTransaction = {
        ...mockTransaction,
        amount: 100000, // Very high amount
        ipAddress: '10.0.0.1', // VPN
        timestamp: new Date('2024-01-01T03:00:00Z').getTime() // 3 AM
      }
      
      const highRiskResult = await FraudDetectionEngine.analyzeTransaction(highRiskTransaction, mockHistory)
      expect(highRiskResult.riskScore).toBeGreaterThan(30)
    })

    it('should block critical risk transactions', async () => {
      // Create a transaction that should trigger blocking
      const criticalRiskHistory = Array.from({ length: 20 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        timestamp: Date.now() - (i * 60000), // Every minute
        amount: 50000 // High amounts
      }))
      
      const criticalTransaction = {
        ...mockTransaction,
        amount: 100000,
        ipAddress: '10.0.0.1'
      }
      
      const result = await FraudDetectionEngine.analyzeTransaction(criticalTransaction, criticalRiskHistory)
      
      expect(result.riskScore).toBeGreaterThan(80)
      expect(result.blocked).toBe(true)
    })
  })

  describe('Recommendations', () => {
    it('should provide appropriate recommendations', async () => {
      const highFrequencyHistory = Array.from({ length: 15 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`,
        timestamp: Date.now() - (i * 60000)
      }))
      
      const result = await FraudDetectionEngine.analyzeTransaction(mockTransaction, highFrequencyHistory)
      
      expect(result.recommendations).toContain('Implement rate limiting')
    })

    it('should recommend different actions based on risk level', async () => {
      const mediumRiskTransaction = {
        ...mockTransaction,
        amount: 5000 // Moderately high amount
      }
      
      const result = await FraudDetectionEngine.analyzeTransaction(mediumRiskTransaction, mockHistory)
      
      if (result.riskScore >= 30 && result.riskScore < 60) {
        expect(result.recommendations).toContain('Request transaction confirmation')
      }
    })
  })

  describe('User Behavior Analysis', () => {
    it('should detect rapid successive actions', async () => {
      const context = {
        lastActionTime: Date.now() - 500, // 500ms ago
        recentActions: ['login', 'stake', 'transfer']
      }
      
      const result = await FraudDetectionEngine.checkUserBehavior('user1', 'transfer', context)
      
      expect(result.riskScore).toBeGreaterThan(15)
      expect(result.flags).toContain('Rapid successive actions detected')
    })

    it('should detect unusual action patterns', async () => {
      const context = {
        lastActionTime: Date.now() - 5000,
        recentActions: Array(15).fill('refresh') // Repetitive actions
      }
      
      const result = await FraudDetectionEngine.checkUserBehavior('user1', 'refresh', context)
      
      expect(result.riskScore).toBeGreaterThan(10)
      expect(result.flags).toContain('Unusual action pattern detected')
    })
  })

  describe('Confidence Calculation', () => {
    it('should calculate higher confidence with more history', async () => {
      const shortHistory = [mockHistory[0]]
      const longHistory = Array.from({ length: 50 }, (_, i) => ({
        ...mockTransaction,
        id: `tx-${i}`
      }))
      
      const shortResult = await FraudDetectionEngine.analyzeTransaction(mockTransaction, shortHistory)
      const longResult = await FraudDetectionEngine.analyzeTransaction(mockTransaction, longHistory)
      
      expect(longResult.confidence).toBeGreaterThan(shortResult.confidence)
    })

    it('should reduce confidence with more flags', async () => {
      const cleanResult = await FraudDetectionEngine.analyzeTransaction(mockTransaction, mockHistory)
      
      const suspiciousTransaction = {
        ...mockTransaction,
        amount: 100000,
        ipAddress: '10.0.0.1',
        timestamp: new Date('2024-01-01T03:00:00Z').getTime()
      }
      
      const suspiciousResult = await FraudDetectionEngine.analyzeTransaction(suspiciousTransaction, mockHistory)
      
      expect(cleanResult.confidence).toBeGreaterThan(suspiciousResult.confidence)
    })
  })
})