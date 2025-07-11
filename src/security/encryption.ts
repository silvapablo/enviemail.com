import CryptoJS from 'crypto-js';

export class EncryptionManager {
  private static readonly ALGORITHM = 'AES';
  private static readonly KEY_SIZE = 256;
  private static readonly IV_SIZE = 16;

  static generateKey(): string {
    return CryptoJS.lib.WordArray.random(this.KEY_SIZE / 8).toString();
  }

  static generateIV(): string {
    return CryptoJS.lib.WordArray.random(this.IV_SIZE).toString();
  }

  static encrypt(data: string, key: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return encrypted.toString();
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  static decrypt(encryptedData: string, key: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  static hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  static hmac(data: string, key: string): string {
    return CryptoJS.HmacSHA256(data, key).toString();
  }

  static generateSignature(data: any, privateKey: string): string {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return this.hmac(dataString, privateKey);
  }

  static verifySignature(data: any, signature: string, privateKey: string): boolean {
    const expectedSignature = this.generateSignature(data, privateKey);
    return signature === expectedSignature;
  }

  static secureRandom(length: number): string {
    return CryptoJS.lib.WordArray.random(length).toString();
  }
}