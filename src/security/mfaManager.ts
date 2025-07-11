import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { MFAConfig } from './types';
import { EncryptionManager } from './encryption';

export class MFAManager {
  private static readonly SERVICE_NAME = 'EmailChain Protocol';
  private static readonly BACKUP_CODES_COUNT = 10;

  static async generateTOTPSecret(userEmail: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: this.SERVICE_NAME,
      length: 32
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32!,
      qrCode
    };
  }

  static async validateTOTP(token: string, secret: string): Promise<boolean> {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time steps before/after current time
      });

      return verified;
    } catch (error) {
      return false;
    }
  }

  static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.BACKUP_CODES_COUNT; i++) {
      const code = this.generateBackupCode();
      codes.push(code);
    }
    return codes;
  }

  private static generateBackupCode(): string {
    // Generate 8-digit backup code
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    return code.substring(0, 4) + '-' + code.substring(4);
  }

  static async validateBackupCode(code: string, backupCodes: string[]): Promise<{ valid: boolean; remainingCodes: string[] }> {
    const normalizedCode = code.replace('-', '');
    const normalizedBackupCodes = backupCodes.map(c => c.replace('-', ''));
    
    const index = normalizedBackupCodes.indexOf(normalizedCode);
    
    if (index === -1) {
      return { valid: false, remainingCodes: backupCodes };
    }

    // Remove used backup code
    const remainingCodes = [...backupCodes];
    remainingCodes.splice(index, 1);

    return { valid: true, remainingCodes };
  }

  static async sendSMSCode(phoneNumber: string): Promise<string> {
    // Generate 6-digit SMS code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`SMS Code for ${phoneNumber}: ${code}`);
    
    // Store code temporarily (in production, use Redis or similar)
    this.storeSMSCode(phoneNumber, code);
    
    return code;
  }

  static async validateSMSCode(phoneNumber: string, code: string): Promise<boolean> {
    const storedCode = this.getSMSCode(phoneNumber);
    
    if (!storedCode) {
      return false;
    }

    const isValid = storedCode.code === code && Date.now() - storedCode.timestamp < 300000; // 5 minutes
    
    if (isValid) {
      this.removeSMSCode(phoneNumber);
    }

    return isValid;
  }

  static async sendEmailCode(email: string): Promise<string> {
    // Generate 6-digit email code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, integrate with email service
    console.log(`Email Code for ${email}: ${code}`);
    
    // Store code temporarily
    this.storeEmailCode(email, code);
    
    return code;
  }

  static async validateEmailCode(email: string, code: string): Promise<boolean> {
    const storedCode = this.getEmailCode(email);
    
    if (!storedCode) {
      return false;
    }

    const isValid = storedCode.code === code && Date.now() - storedCode.timestamp < 600000; // 10 minutes
    
    if (isValid) {
      this.removeEmailCode(email);
    }

    return isValid;
  }

  static createMFAConfig(methods: MFAConfig['methods']): MFAConfig {
    return {
      enabled: true,
      methods,
      backupCodes: this.generateBackupCodes(),
      lastUsed: Date.now()
    };
  }

  static async verifyMFA(
    method: 'totp' | 'sms' | 'email' | 'backup',
    code: string,
    config: MFAConfig,
    identifier?: string
  ): Promise<{ success: boolean; updatedConfig?: MFAConfig }> {
    switch (method) {
      case 'totp':
        if (!config.secret) return { success: false };
        const totpValid = await this.validateTOTP(code, config.secret);
        if (totpValid) {
          config.lastUsed = Date.now();
        }
        return { success: totpValid, updatedConfig: config };

      case 'sms':
        if (!identifier) return { success: false };
        const smsValid = await this.validateSMSCode(identifier, code);
        if (smsValid) {
          config.lastUsed = Date.now();
        }
        return { success: smsValid, updatedConfig: config };

      case 'email':
        if (!identifier) return { success: false };
        const emailValid = await this.validateEmailCode(identifier, code);
        if (emailValid) {
          config.lastUsed = Date.now();
        }
        return { success: emailValid, updatedConfig: config };

      case 'backup':
        const backupResult = await this.validateBackupCode(code, config.backupCodes);
        if (backupResult.valid) {
          config.backupCodes = backupResult.remainingCodes;
          config.lastUsed = Date.now();
        }
        return { success: backupResult.valid, updatedConfig: config };

      default:
        return { success: false };
    }
  }

  // Temporary storage methods (in production, use Redis or database)
  private static smsCodeStorage = new Map<string, { code: string; timestamp: number }>();
  private static emailCodeStorage = new Map<string, { code: string; timestamp: number }>();

  private static storeSMSCode(phoneNumber: string, code: string): void {
    this.smsCodeStorage.set(phoneNumber, { code, timestamp: Date.now() });
  }

  private static getSMSCode(phoneNumber: string): { code: string; timestamp: number } | undefined {
    return this.smsCodeStorage.get(phoneNumber);
  }

  private static removeSMSCode(phoneNumber: string): void {
    this.smsCodeStorage.delete(phoneNumber);
  }

  private static storeEmailCode(email: string, code: string): void {
    this.emailCodeStorage.set(email, { code, timestamp: Date.now() });
  }

  private static getEmailCode(email: string): { code: string; timestamp: number } | undefined {
    return this.emailCodeStorage.get(email);
  }

  private static removeEmailCode(email: string): void {
    this.emailCodeStorage.delete(email);
  }
}