import React, { useState } from 'react';
import { Shield, Smartphone, Mail, Key, Copy, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MFAManager } from '../../security/mfaManager';
import { useSecureStore } from '../../store/secureStore';

export const MFASetup: React.FC = () => {
  const { user, securityConfig } = useSecureStore();
  const [step, setStep] = useState<'select' | 'totp' | 'sms' | 'email' | 'backup'>('select');
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.address || '');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const setupTOTP = async () => {
    if (!user) return;
    
    try {
      const { secret, qrCode } = await MFAManager.generateTOTPSecret(user.address);
      setTotpSecret(secret);
      setQrCode(qrCode);
      setStep('totp');
    } catch (error) {
      console.error('Failed to setup TOTP:', error);
    }
  };

  const verifyTOTP = async () => {
    if (!totpSecret || !verificationCode) return;
    
    setIsVerifying(true);
    try {
      const isValid = await MFAManager.validateTOTP(verificationCode, totpSecret);
      if (isValid) {
        const codes = MFAManager.generateBackupCodes();
        setBackupCodes(codes);
        setStep('backup');
      } else {
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('TOTP verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const setupSMS = async () => {
    if (!phoneNumber) return;
    
    try {
      await MFAManager.sendSMSCode(phoneNumber);
      setStep('sms');
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  };

  const verifySMS = async () => {
    if (!phoneNumber || !verificationCode) return;
    
    setIsVerifying(true);
    try {
      const isValid = await MFAManager.validateSMSCode(phoneNumber, verificationCode);
      if (isValid) {
        const codes = MFAManager.generateBackupCodes();
        setBackupCodes(codes);
        setStep('backup');
      } else {
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('SMS verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const setupEmail = async () => {
    if (!email) return;
    
    try {
      await MFAManager.sendEmailCode(email);
      setStep('email');
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const verifyEmail = async () => {
    if (!email || !verificationCode) return;
    
    setIsVerifying(true);
    try {
      const isValid = await MFAManager.validateEmailCode(email, verificationCode);
      if (isValid) {
        const codes = MFAManager.generateBackupCodes();
        setBackupCodes(codes);
        setStep('backup');
      } else {
        alert('Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const completeMFASetup = () => {
    // In production, save MFA configuration to backend
    alert('MFA setup completed successfully!');
    setStep('select');
  };

  if (!user) {
    return (
      <Card>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Please connect your wallet to setup MFA</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Multi-Factor Authentication</h2>
        <p className="text-gray-400">Add an extra layer of security to your account</p>
      </div>

      {step === 'select' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hover className="cursor-pointer" onClick={setupTOTP}>
            <div className="text-center p-6">
              <Smartphone className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Authenticator App</h3>
              <p className="text-gray-400 text-sm mb-4">
                Use Google Authenticator, Authy, or similar apps
              </p>
              <Badge variant="info">Recommended</Badge>
            </div>
          </Card>

          <Card hover className="cursor-pointer">
            <div className="text-center p-6">
              <Mail className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">SMS Verification</h3>
              <p className="text-gray-400 text-sm mb-4">
                Receive codes via text message
              </p>
              <div className="space-y-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                />
                <Button onClick={setupSMS} size="sm" className="w-full">
                  Setup SMS
                </Button>
              </div>
            </div>
          </Card>

          <Card hover className="cursor-pointer">
            <div className="text-center p-6">
              <Key className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Email Verification</h3>
              <p className="text-gray-400 text-sm mb-4">
                Receive codes via email
              </p>
              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                />
                <Button onClick={setupEmail} size="sm" className="w-full">
                  Setup Email
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === 'totp' && (
        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Setup Authenticator App</h3>
              <p className="text-gray-400">Scan the QR code with your authenticator app</p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 mb-2">Or enter this secret key manually:</p>
              <div className="bg-gray-800 p-3 rounded-lg font-mono text-sm text-gray-300 break-all">
                {totpSecret}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter verification code from your app
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 text-center text-lg font-mono"
                />
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={verifyTOTP} 
                  loading={isVerifying}
                  disabled={verificationCode.length !== 6}
                  className="flex-1"
                >
                  Verify & Continue
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {(step === 'sms' || step === 'email') && (
        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">
                Verify {step === 'sms' ? 'SMS' : 'Email'} Code
              </h3>
              <p className="text-gray-400">
                Enter the verification code sent to {step === 'sms' ? phoneNumber : email}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 text-center text-lg font-mono"
                />
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={step === 'sms' ? verifySMS : verifyEmail}
                  loading={isVerifying}
                  disabled={verificationCode.length !== 6}
                  className="flex-1"
                >
                  Verify & Continue
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {step === 'backup' && (
        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Save Backup Codes</h3>
              <p className="text-gray-400">
                Store these backup codes in a safe place. You can use them to access your account if you lose your device.
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">Backup Codes</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBackupCodes}
                  className="flex items-center space-x-2"
                >
                  {copiedCodes ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedCodes ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-gray-900 p-2 rounded font-mono text-sm text-gray-300 text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-yellow-400 font-medium">Important Security Notice</h4>
                  <ul className="text-gray-400 text-sm mt-1 space-y-1">
                    <li>• Each backup code can only be used once</li>
                    <li>• Store these codes in a secure location</li>
                    <li>• Don't share these codes with anyone</li>
                    <li>• Generate new codes if these are compromised</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={completeMFASetup} className="w-full">
              Complete MFA Setup
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};