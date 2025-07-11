import DOMPurify from 'dompurify';
import { ValidationRule, SecurityError } from './types';

export class SecureValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
  private static readonly SUSPICIOUS_PATTERNS = [
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /<script/i,
    /eval\(/i,
    /expression\(/i
  ];

  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      throw new SecurityError('Invalid input type', 'INVALID_INPUT', 'medium', 'Invalid input provided', 'Non-string input detected', {}, Date.now());
    }

    // Remove null bytes and control characters
    let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Use DOMPurify to sanitize HTML
    sanitized = DOMPurify.sanitize(sanitized, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });

    // Additional XSS prevention
    sanitized = sanitized
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '');

    return sanitized.trim();
  }

  static validateEmail(email: string): boolean {
    const sanitized = this.sanitizeInput(email);
    return this.EMAIL_REGEX.test(sanitized) && sanitized.length <= 254;
  }

  static validateWalletAddress(address: string): boolean {
    const sanitized = this.sanitizeInput(address);
    return this.WALLET_ADDRESS_REGEX.test(sanitized);
  }

  static validateAmount(amount: number): boolean {
    return typeof amount === 'number' && 
           amount >= 0 && 
           amount <= Number.MAX_SAFE_INTEGER &&
           !isNaN(amount) &&
           isFinite(amount);
  }

  static validateEmailContent(content: string): { isValid: boolean; risks: string[] } {
    const sanitized = this.sanitizeInput(content);
    const risks: string[] = [];

    // Check for suspicious patterns
    this.SUSPICIOUS_PATTERNS.forEach(pattern => {
      if (pattern.test(sanitized)) {
        risks.push('Suspicious script pattern detected');
      }
    });

    // Check for phishing indicators
    if (this.detectPhishingPatterns(sanitized)) {
      risks.push('Potential phishing content detected');
    }

    // Check for excessive links
    const linkCount = (sanitized.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount > 10) {
      risks.push('Excessive number of links detected');
    }

    // Check for suspicious domains
    if (this.detectSuspiciousDomains(sanitized)) {
      risks.push('Suspicious domains detected');
    }

    return {
      isValid: risks.length === 0,
      risks
    };
  }

  private static detectPhishingPatterns(content: string): boolean {
    const phishingKeywords = [
      'urgent action required',
      'verify your account',
      'suspended account',
      'click here immediately',
      'limited time offer',
      'act now',
      'confirm your identity',
      'update payment information'
    ];

    const lowerContent = content.toLowerCase();
    return phishingKeywords.some(keyword => lowerContent.includes(keyword));
  }

  private static detectSuspiciousDomains(content: string): boolean {
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf'];
    const urls = content.match(/https?:\/\/[^\s]+/g) || [];
    
    return urls.some(url => {
      try {
        const domain = new URL(url).hostname;
        return suspiciousTlds.some(tld => domain.endsWith(tld));
      } catch {
        return true; // Invalid URL is suspicious
      }
    });
  }

  static validateForm(data: Record<string, any>, rules: Record<string, ValidationRule[]>): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};

    Object.keys(rules).forEach(field => {
      const fieldRules = rules[field];
      const value = data[field];
      const fieldErrors: string[] = [];

      fieldRules.forEach(rule => {
        switch (rule.type) {
          case 'required':
            if (!value || (typeof value === 'string' && value.trim() === '')) {
              fieldErrors.push(rule.message);
            }
            break;
          case 'email':
            if (value && !this.validateEmail(value)) {
              fieldErrors.push(rule.message);
            }
            break;
          case 'number':
            if (value && !this.validateAmount(value)) {
              fieldErrors.push(rule.message);
            }
            break;
          case 'pattern':
            if (value && rule.pattern && !rule.pattern.test(value)) {
              fieldErrors.push(rule.message);
            }
            break;
          case 'custom':
            if (value && rule.validator && !rule.validator(value)) {
              fieldErrors.push(rule.message);
            }
            break;
        }
      });

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}