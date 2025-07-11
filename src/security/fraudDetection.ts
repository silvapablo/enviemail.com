import { SecureTransaction, FraudDetectionResult } from './types';
import { EncryptionManager } from './encryption';

export class FraudDetectionEngine {
  private static readonly RISK_THRESHOLDS = {
    LOW: 30,
    MEDIUM: 60,
    HIGH: 80,
    CRITICAL: 95
  };

  private static readonly VELOCITY_LIMITS = {
    TRANSACTIONS_PER_HOUR: 10,
    AMOUNT_PER_HOUR: 100000,
    UNIQUE_RECIPIENTS_PER_DAY: 50
  };

  static async analyzeTransaction(transaction: SecureTransaction, userHistory: SecureTransaction[]): Promise<FraudDetectionResult> {
    const flags: string[] = [];
    let riskScore = 0;

    // Velocity analysis
    const velocityRisk = this.analyzeVelocity(transaction, userHistory);
    riskScore += velocityRisk.score;
    flags.push(...velocityRisk.flags);

    // Amount analysis
    const amountRisk = this.analyzeAmount(transaction, userHistory);
    riskScore += amountRisk.score;
    flags.push(...amountRisk.flags);

    // Pattern analysis
    const patternRisk = this.analyzePatterns(transaction, userHistory);
    riskScore += patternRisk.score;
    flags.push(...patternRisk.flags);

    // Geographic analysis
    const geoRisk = this.analyzeGeolocation(transaction, userHistory);
    riskScore += geoRisk.score;
    flags.push(...geoRisk.flags);

    // Time-based analysis
    const timeRisk = this.analyzeTimingPatterns(transaction, userHistory);
    riskScore += timeRisk.score;
    flags.push(...timeRisk.flags);

    const recommendations = this.generateRecommendations(riskScore, flags);
    const blocked = riskScore >= this.RISK_THRESHOLDS.CRITICAL;

    return {
      riskScore: Math.min(riskScore, 100),
      flags: [...new Set(flags)], // Remove duplicates
      recommendations,
      blocked,
      confidence: this.calculateConfidence(flags.length, userHistory.length)
    };
  }

  private static analyzeVelocity(transaction: SecureTransaction, history: SecureTransaction[]): { score: number; flags: string[] } {
    const now = transaction.timestamp;
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentTransactions = history.filter(tx => now - tx.timestamp <= oneHour);
    const dailyTransactions = history.filter(tx => now - tx.timestamp <= oneDay);

    const flags: string[] = [];
    let score = 0;

    // Check transaction frequency
    if (recentTransactions.length > this.VELOCITY_LIMITS.TRANSACTIONS_PER_HOUR) {
      flags.push('High transaction frequency detected');
      score += 25;
    }

    // Check amount velocity
    const hourlyAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    if (hourlyAmount > this.VELOCITY_LIMITS.AMOUNT_PER_HOUR) {
      flags.push('High amount velocity detected');
      score += 30;
    }

    // Check unique recipients
    const uniqueRecipients = new Set(dailyTransactions.map(tx => tx.to)).size;
    if (uniqueRecipients > this.VELOCITY_LIMITS.UNIQUE_RECIPIENTS_PER_DAY) {
      flags.push('Too many unique recipients');
      score += 20;
    }

    return { score, flags };
  }

  private static analyzeAmount(transaction: SecureTransaction, history: SecureTransaction[]): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    if (history.length === 0) return { score: 10, flags: ['New user - limited history'] };

    const amounts = history.map(tx => tx.amount);
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);

    // Check for unusually large amounts
    if (transaction.amount > avgAmount * 10) {
      flags.push('Amount significantly higher than average');
      score += 25;
    }

    if (transaction.amount > maxAmount * 2) {
      flags.push('Amount exceeds historical maximum');
      score += 20;
    }

    // Check for round numbers (potential automation)
    if (transaction.amount % 1000 === 0 && transaction.amount >= 10000) {
      flags.push('Suspicious round number amount');
      score += 10;
    }

    return { score, flags };
  }

  private static analyzePatterns(transaction: SecureTransaction, history: SecureTransaction[]): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    // Check for repeated exact amounts
    const sameAmountCount = history.filter(tx => tx.amount === transaction.amount).length;
    if (sameAmountCount > 5) {
      flags.push('Repeated exact amounts detected');
      score += 15;
    }

    // Check for sequential timing patterns
    const timeDiffs = history.slice(-5).map((tx, i, arr) => 
      i > 0 ? tx.timestamp - arr[i-1].timestamp : 0
    ).filter(diff => diff > 0);

    if (timeDiffs.length > 2) {
      const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
      const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgTimeDiff, 2), 0) / timeDiffs.length;
      
      if (variance < avgTimeDiff * 0.1) { // Very consistent timing
        flags.push('Automated transaction pattern detected');
        score += 20;
      }
    }

    return { score, flags };
  }

  private static analyzeGeolocation(transaction: SecureTransaction, history: SecureTransaction[]): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    // This would integrate with a real geolocation service
    // For now, we'll simulate based on IP patterns
    const currentIP = transaction.ipAddress;
    const recentIPs = history.slice(-10).map(tx => tx.ipAddress);

    // Check for IP jumping
    const uniqueRecentIPs = new Set(recentIPs);
    if (uniqueRecentIPs.size > 3) {
      flags.push('Multiple IP addresses detected');
      score += 15;
    }

    // Check for known VPN/Proxy patterns (simplified)
    if (this.isVPNOrProxy(currentIP)) {
      flags.push('VPN or proxy usage detected');
      score += 10;
    }

    return { score, flags };
  }

  private static analyzeTimingPatterns(transaction: SecureTransaction, history: SecureTransaction[]): { score: number; flags: string[] } {
    const flags: string[] = [];
    let score = 0;

    const hour = new Date(transaction.timestamp).getHours();
    
    // Check for unusual hours (2 AM - 6 AM)
    if (hour >= 2 && hour <= 6) {
      flags.push('Transaction during unusual hours');
      score += 10;
    }

    // Check for weekend activity patterns
    const dayOfWeek = new Date(transaction.timestamp).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const weekendTransactions = history.filter(tx => {
        const txDay = new Date(tx.timestamp).getDay();
        return txDay === 0 || txDay === 6;
      });
      
      if (weekendTransactions.length / history.length > 0.5) {
        flags.push('High weekend activity pattern');
        score += 5;
      }
    }

    return { score, flags };
  }

  private static isVPNOrProxy(ip: string): boolean {
    // Simplified VPN/Proxy detection
    // In production, this would use a real service
    const vpnPatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./
    ];

    return vpnPatterns.some(pattern => pattern.test(ip));
  }

  private static generateRecommendations(riskScore: number, flags: string[]): string[] {
    const recommendations: string[] = [];

    if (riskScore >= this.RISK_THRESHOLDS.CRITICAL) {
      recommendations.push('Block transaction immediately');
      recommendations.push('Require manual review');
      recommendations.push('Contact user for verification');
    } else if (riskScore >= this.RISK_THRESHOLDS.HIGH) {
      recommendations.push('Require additional authentication');
      recommendations.push('Implement transaction delay');
      recommendations.push('Monitor closely');
    } else if (riskScore >= this.RISK_THRESHOLDS.MEDIUM) {
      recommendations.push('Request transaction confirmation');
      recommendations.push('Log for review');
    } else if (riskScore >= this.RISK_THRESHOLDS.LOW) {
      recommendations.push('Monitor transaction');
    }

    // Specific recommendations based on flags
    if (flags.includes('High transaction frequency detected')) {
      recommendations.push('Implement rate limiting');
    }
    if (flags.includes('VPN or proxy usage detected')) {
      recommendations.push('Verify user location');
    }
    if (flags.includes('Automated transaction pattern detected')) {
      recommendations.push('Implement CAPTCHA verification');
    }

    return [...new Set(recommendations)];
  }

  private static calculateConfidence(flagCount: number, historyLength: number): number {
    const baseConfidence = Math.min(historyLength * 2, 80); // More history = higher confidence
    const flagPenalty = flagCount * 5; // More flags = lower confidence
    return Math.max(Math.min(baseConfidence - flagPenalty, 95), 20);
  }

  static async checkUserBehavior(userId: string, action: string, context: any): Promise<FraudDetectionResult> {
    // Analyze user behavior patterns
    const flags: string[] = [];
    let riskScore = 0;

    // Check for rapid successive actions
    if (context.lastActionTime && Date.now() - context.lastActionTime < 1000) {
      flags.push('Rapid successive actions detected');
      riskScore += 20;
    }

    // Check for unusual action patterns
    if (this.isUnusualActionPattern(action, context.recentActions)) {
      flags.push('Unusual action pattern detected');
      riskScore += 15;
    }

    return {
      riskScore,
      flags,
      recommendations: this.generateRecommendations(riskScore, flags),
      blocked: riskScore >= this.RISK_THRESHOLDS.HIGH,
      confidence: 85
    };
  }

  private static isUnusualActionPattern(action: string, recentActions: string[]): boolean {
    // Check for repetitive actions
    const sameActionCount = recentActions.filter(a => a === action).length;
    return sameActionCount > 10;
  }
}