export interface SecurityConfig {
  encryptionKey: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  csrfToken: string;
  mfaEnabled: boolean;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface SecureTransaction {
  id: string;
  hash: string;
  timestamp: number;
  type: 'stake' | 'unstake' | 'campaign' | 'validation' | 'reward' | 'penalty';
  amount: number;
  from: string;
  to: string;
  gasUsed: number;
  status: 'pending' | 'confirmed' | 'failed';
  signature: string;
  ipAddress: string;
  userAgent: string;
  blockNumber: number;
  confirmations: number;
  securityScore: number;
  riskFlags: string[];
}

export interface SecurityAuditLog {
  transactionId: string;
  securityChecks: Array<{
    check: string;
    result: 'pass' | 'fail' | 'warning';
    details: string;
    timestamp: number;
  }>;
  riskScore: number;
  flagged: boolean;
  reviewRequired: boolean;
}

export interface SecureNotification {
  id: string;
  userId: string;
  type: 'security' | 'transaction' | 'campaign' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  encryptedContent: string;
  timestamp: number;
  delivered: boolean;
  read: boolean;
  signature: string;
  expiresAt: number;
}

export interface SecureSession {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  permissions: string[];
  mfaVerified: boolean;
  riskScore: number;
  confidence: number;
}

export interface DeviceSecurityReport {
  isJailbroken: boolean;
  hasSecureBootloader: boolean;
  osVersion: string;
  securityPatchLevel: string;
  hasAntiMalware: boolean;
  riskScore: number;
  threats: string[];
}

export interface MFAConfig {
  enabled: boolean;
  methods: Array<'totp' | 'sms' | 'email' | 'hardware'>;
  backupCodes: string[];
  lastUsed: number;
  secret?: string;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'number' | 'custom' | 'pattern';
  message: string;
  validator?: (value: any) => boolean;
  sanitizer?: (value: any) => any;
  pattern?: RegExp;
}

export class SecurityError extends Error {
  public riskScore: number;
  public flags: string[];
  public recommendations: string[];
  public blocked: boolean;
  public confidence: number;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  internalMessage: string;
  context: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId?: string;

  constructor(
    message: string,
    code: string = 'SECURITY_ERROR',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.severity = severity;
    this.userMessage = message;
    this.internalMessage = message;
    this.context = {};
    this.timestamp = Date.now();
  }
}