import { SecureSession, SecurityError } from './types';
import { EncryptionManager } from './encryption';

export class SessionManager {
  private static sessions = new Map<string, SecureSession>();
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_SESSIONS_PER_USER = 3;

  static async createSession(userId: string, deviceInfo: any): Promise<string> {
    // Clean up expired sessions
    this.cleanupExpiredSessions();

    // Check for existing sessions for this user
    const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    
    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Remove oldest session
      const oldestSession = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
      this.sessions.delete(oldestSession.id);
    }

    const sessionId = EncryptionManager.secureRandom(32);
    const now = Date.now();
    
    const session: SecureSession = {
      id: sessionId,
      userId,
      deviceId: this.generateDeviceId(deviceInfo),
      ipAddress: this.hashIP(deviceInfo.ipAddress),
      userAgent: this.hashUserAgent(deviceInfo.userAgent),
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.SESSION_TIMEOUT,
      permissions: ['read', 'write'], // Default permissions
      mfaVerified: false,
      riskScore: this.calculateInitialRiskScore(deviceInfo)
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  static async validateSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    const now = Date.now();
    
    // Check if session is expired
    if (now > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }

    // Update last activity and extend session
    session.lastActivity = now;
    session.expiresAt = now + this.SESSION_TIMEOUT;
    
    return true;
  }

  static async getSession(sessionId: string): Promise<SecureSession | null> {
    const isValid = await this.validateSession(sessionId);
    return isValid ? this.sessions.get(sessionId) || null : null;
  }

  static async updateSessionRisk(sessionId: string, riskDelta: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.riskScore = Math.max(0, Math.min(100, session.riskScore + riskDelta));
      
      // If risk is too high, invalidate session
      if (session.riskScore > 80) {
        this.sessions.delete(sessionId);
        throw new SecurityError(
          'Session invalidated due to high risk score',
          'HIGH_RISK_SESSION',
          'high',
          'Session has been terminated for security reasons',
          `Session ${sessionId} invalidated with risk score ${session.riskScore}`,
          { sessionId, riskScore: session.riskScore },
          Date.now(),
          session.userId,
          sessionId
        );
      }
    }
  }

  static async detectSessionHijacking(sessionId: string, currentRequest: any): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return true; // No session = potential hijacking

    const currentDeviceId = this.generateDeviceId(currentRequest);
    const currentIPHash = this.hashIP(currentRequest.ipAddress);
    const currentUAHash = this.hashUserAgent(currentRequest.userAgent);

    // Check for device mismatch
    if (session.deviceId !== currentDeviceId) {
      await this.updateSessionRisk(sessionId, 30);
      return true;
    }

    // Check for IP address change
    if (session.ipAddress !== currentIPHash) {
      await this.updateSessionRisk(sessionId, 20);
    }

    // Check for user agent change
    if (session.userAgent !== currentUAHash) {
      await this.updateSessionRisk(sessionId, 15);
    }

    return false;
  }

  static async invalidateSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => session.userId === userId);
    
    userSessions.forEach(([sessionId, _]) => {
      this.sessions.delete(sessionId);
    });
  }

  private static cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => now > session.expiresAt);
    
    expiredSessions.forEach(([sessionId, _]) => {
      this.sessions.delete(sessionId);
    });
  }

  private static generateDeviceId(deviceInfo: any): string {
    const deviceString = `${deviceInfo.userAgent}-${deviceInfo.screen?.width}-${deviceInfo.screen?.height}-${deviceInfo.timezone}`;
    return EncryptionManager.hash(deviceString);
  }

  private static hashIP(ip: string): string {
    return EncryptionManager.hash(ip);
  }

  private static hashUserAgent(userAgent: string): string {
    return EncryptionManager.hash(userAgent);
  }

  private static calculateInitialRiskScore(deviceInfo: any): number {
    let riskScore = 0;

    // Check for suspicious user agent
    if (this.isSuspiciousUserAgent(deviceInfo.userAgent)) {
      riskScore += 20;
    }

    // Check for VPN/Proxy
    if (this.isVPNOrProxy(deviceInfo.ipAddress)) {
      riskScore += 15;
    }

    // Check for unusual timezone
    if (this.isUnusualTimezone(deviceInfo.timezone)) {
      riskScore += 10;
    }

    return Math.min(riskScore, 100);
  }

  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private static isVPNOrProxy(ip: string): boolean {
    // Simplified VPN/Proxy detection
    const vpnPatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./
    ];

    return vpnPatterns.some(pattern => pattern.test(ip));
  }

  private static isUnusualTimezone(timezone: string): boolean {
    // Check for unusual or suspicious timezones
    const suspiciousTimezones = [
      'UTC',
      'GMT',
      'Etc/GMT'
    ];

    return suspiciousTimezones.includes(timezone);
  }
}