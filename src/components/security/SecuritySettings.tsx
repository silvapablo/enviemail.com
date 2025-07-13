import React, { useState } from 'react';
import { Shield, Lock, Eye, Bell, Key, AlertTriangle, CheckCircle, Save, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export const SecuritySettings: React.FC = () => {
  const { user } = useAuth();
  
  // Security settings state
  const [settings, setSettings] = useState({
    // Authentication Settings
    mfaEnabled: false,
    mfaMethods: {
      totp: false,
      sms: false,
      email: false
    },
    sessionTimeout: 30, // minutes
    requireMfaForTransactions: true,
    
    // Privacy Settings
    hideWalletAddress: false,
    hideTransactionHistory: false,
    allowAnalytics: true,
    shareReputationPublicly: true,
    
    // Notification Settings
    securityAlerts: true,
    loginNotifications: true,
    transactionNotifications: true,
    suspiciousActivityAlerts: true,
    
    // Advanced Security
    ipWhitelist: [],
    deviceTrust: true,
    autoLogoutOnSuspiciousActivity: true,
    encryptLocalData: true,
    
    // API & Integration Settings
    apiAccessEnabled: false,
    webhookNotifications: false,
    thirdPartyIntegrations: false
  });

  const [newWhitelistIP, setNewWhitelistIP] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' && !Array.isArray(prev[category])
        ? { ...prev[category], [setting]: value }
        : value
    }));
  };

  const addIPToWhitelist = () => {
    if (newWhitelistIP && /^(\d{1,3}\.){3}\d{1,3}$/.test(newWhitelistIP)) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newWhitelistIP]
      }));
      setNewWhitelistIP('');
    }
  };

  const removeIPFromWhitelist = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(item => item !== ip)
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
      console.log('Security settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      mfaEnabled: false,
      mfaMethods: { totp: false, sms: false, email: false },
      sessionTimeout: 30,
      requireMfaForTransactions: true,
      hideWalletAddress: false,
      hideTransactionHistory: false,
      allowAnalytics: true,
      shareReputationPublicly: true,
      securityAlerts: true,
      loginNotifications: true,
      transactionNotifications: true,
      suspiciousActivityAlerts: true,
      ipWhitelist: [],
      deviceTrust: true,
      autoLogoutOnSuspiciousActivity: true,
      encryptLocalData: true,
      apiAccessEnabled: false,
      webhookNotifications: false,
      thirdPartyIntegrations: false
    });
  };

  if (!user) {
    return (
      <Card>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Please connect your wallet to access security settings</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Security Settings</h2>
          <p className="text-gray-400">Configure your account security preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          {lastSaved && (
            <span className="text-sm text-gray-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={resetToDefaults}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
          <Button
            onClick={saveSettings}
            loading={isSaving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Authentication Settings */}
      <Card>
        <div className="flex items-center space-x-2 mb-6">
          <Lock className="h-5 w-5 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Authentication & Access</h3>
        </div>

        <div className="space-y-6">
          {/* Multi-Factor Authentication */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-white">Multi-Factor Authentication</h4>
                <p className="text-gray-400 text-sm">Add extra security layers to your account</p>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.mfaEnabled}
                  onChange={(e) => handleSettingChange('mfaEnabled', '', e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
                />
                <span className="text-gray-300">Enable MFA</span>
              </label>
            </div>

            {settings.mfaEnabled && (
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                <h5 className="font-medium text-gray-300">MFA Methods</h5>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.mfaMethods.totp}
                      onChange={(e) => handleSettingChange('mfaMethods', 'totp', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-gray-300">Authenticator App (TOTP)</span>
                    <Badge variant="info" size="sm">Recommended</Badge>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.mfaMethods.sms}
                      onChange={(e) => handleSettingChange('mfaMethods', 'sms', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-gray-300">SMS Verification</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.mfaMethods.email}
                      onChange={(e) => handleSettingChange('mfaMethods', 'email', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-gray-300">Email Verification</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Session Settings */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Session Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', '', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={480}>8 hours</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.requireMfaForTransactions}
                    onChange={(e) => handleSettingChange('requireMfaForTransactions', '', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
                  />
                  <span className="text-gray-300">Require MFA for transactions</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <div className="flex items-center space-x-2 mb-6">
          <Eye className="h-5 w-5 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Privacy & Data</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Hide wallet address from public view</span>
              <p className="text-gray-400 text-sm">Your wallet address won't be visible to other users</p>
            </div>
            <input
              type="checkbox"
              checked={settings.hideWalletAddress}
              onChange={(e) => handleSettingChange('hideWalletAddress', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Hide transaction history</span>
              <p className="text-gray-400 text-sm">Keep your transaction history private</p>
            </div>
            <input
              type="checkbox"
              checked={settings.hideTransactionHistory}
              onChange={(e) => handleSettingChange('hideTransactionHistory', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Allow analytics collection</span>
              <p className="text-gray-400 text-sm">Help improve the platform with anonymous usage data</p>
            </div>
            <input
              type="checkbox"
              checked={settings.allowAnalytics}
              onChange={(e) => handleSettingChange('allowAnalytics', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Share reputation publicly</span>
              <p className="text-gray-400 text-sm">Allow others to see your reputation score and tier</p>
            </div>
            <input
              type="checkbox"
              checked={settings.shareReputationPublicly}
              onChange={(e) => handleSettingChange('shareReputationPublicly', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card>
        <div className="flex items-center space-x-2 mb-6">
          <Bell className="h-5 w-5 text-green-400" />
          <h3 className="text-xl font-bold text-white">Notifications</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Security alerts</span>
              <p className="text-gray-400 text-sm">Get notified about security events and threats</p>
            </div>
            <input
              type="checkbox"
              checked={settings.securityAlerts}
              onChange={(e) => handleSettingChange('securityAlerts', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Login notifications</span>
              <p className="text-gray-400 text-sm">Receive alerts when someone logs into your account</p>
            </div>
            <input
              type="checkbox"
              checked={settings.loginNotifications}
              onChange={(e) => handleSettingChange('loginNotifications', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Transaction notifications</span>
              <p className="text-gray-400 text-sm">Get notified about transaction confirmations and failures</p>
            </div>
            <input
              type="checkbox"
              checked={settings.transactionNotifications}
              onChange={(e) => handleSettingChange('transactionNotifications', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Suspicious activity alerts</span>
              <p className="text-gray-400 text-sm">Immediate alerts for unusual account activity</p>
            </div>
            <input
              type="checkbox"
              checked={settings.suspiciousActivityAlerts}
              onChange={(e) => handleSettingChange('suspiciousActivityAlerts', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>
        </div>
      </Card>

      {/* Advanced Security */}
      <Card>
        <div className="flex items-center space-x-2 mb-6">
          <Key className="h-5 w-5 text-red-400" />
          <h3 className="text-xl font-bold text-white">Advanced Security</h3>
        </div>

        <div className="space-y-6">
          {/* IP Whitelist */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">IP Address Whitelist</h4>
            <p className="text-gray-400 text-sm mb-4">
              Only allow access from specific IP addresses. Leave empty to allow all IPs.
            </p>
            
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newWhitelistIP}
                onChange={(e) => setNewWhitelistIP(e.target.value)}
                placeholder="192.168.1.1"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
              <Button onClick={addIPToWhitelist} size="sm">
                Add IP
              </Button>
            </div>

            {settings.ipWhitelist.length > 0 && (
              <div className="space-y-2">
                {settings.ipWhitelist.map((ip, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                    <span className="text-gray-300 font-mono">{ip}</span>
                    <Button
                      onClick={() => removeIPFromWhitelist(ip)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other Advanced Settings */}
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <span className="text-gray-300">Device trust management</span>
                <p className="text-gray-400 text-sm">Remember trusted devices to reduce MFA prompts</p>
              </div>
              <input
                type="checkbox"
                checked={settings.deviceTrust}
                onChange={(e) => handleSettingChange('deviceTrust', '', e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="text-gray-300">Auto-logout on suspicious activity</span>
                <p className="text-gray-400 text-sm">Automatically log out when unusual activity is detected</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoLogoutOnSuspiciousActivity}
                onChange={(e) => handleSettingChange('autoLogoutOnSuspiciousActivity', '', e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <span className="text-gray-300">Encrypt local data</span>
                <p className="text-gray-400 text-sm">Encrypt sensitive data stored in your browser</p>
              </div>
              <input
                type="checkbox"
                checked={settings.encryptLocalData}
                onChange={(e) => handleSettingChange('encryptLocalData', '', e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* API & Integrations */}
      <Card>
        <div className="flex items-center space-x-2 mb-6">
          <Key className="h-5 w-5 text-purple-400" />
          <h3 className="text-xl font-bold text-white">API & Integrations</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Enable API access</span>
              <p className="text-gray-400 text-sm">Allow third-party applications to access your account via API</p>
            </div>
            <input
              type="checkbox"
              checked={settings.apiAccessEnabled}
              onChange={(e) => handleSettingChange('apiAccessEnabled', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Webhook notifications</span>
              <p className="text-gray-400 text-sm">Send real-time notifications to external services</p>
            </div>
            <input
              type="checkbox"
              checked={settings.webhookNotifications}
              onChange={(e) => handleSettingChange('webhookNotifications', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-gray-300">Third-party integrations</span>
              <p className="text-gray-400 text-sm">Allow connections with external email and marketing platforms</p>
            </div>
            <input
              type="checkbox"
              checked={settings.thirdPartyIntegrations}
              onChange={(e) => handleSettingChange('thirdPartyIntegrations', '', e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
            />
          </label>
        </div>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Security Recommendations</h3>
        </div>

        <div className="space-y-3">
          {!settings.mfaEnabled && (
            <div className="flex items-center space-x-3 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-yellow-400 font-medium">Enable Multi-Factor Authentication</p>
                <p className="text-yellow-300 text-sm">Add an extra layer of security to your account</p>
              </div>
            </div>
          )}

          {settings.sessionTimeout > 60 && (
            <div className="flex items-center space-x-3 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-blue-400 font-medium">Consider shorter session timeout</p>
                <p className="text-blue-300 text-sm">Shorter sessions reduce security risks</p>
              </div>
            </div>
          )}

          {settings.ipWhitelist.length === 0 && (
            <div className="flex items-center space-x-3 p-3 bg-green-900/20 border border-green-800 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Consider IP whitelisting</p>
                <p className="text-green-300 text-sm">Restrict access to trusted IP addresses for enhanced security</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};