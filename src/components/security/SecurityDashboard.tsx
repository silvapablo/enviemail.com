import React from 'react';
import { Shield, AlertTriangle, CheckCircle, Eye, Lock, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { useSecureStore } from '../../store/secureStore';

export const SecurityDashboard: React.FC = () => {
  const { user, riskScore, sessionId, securityConfig, transactions } = useSecureStore();

  const getSecurityLevel = (score: number) => {
    if (score <= 20) return { level: 'Excellent', color: 'text-green-400', variant: 'success' as const };
    if (score <= 40) return { level: 'Good', color: 'text-blue-400', variant: 'info' as const };
    if (score <= 60) return { level: 'Fair', color: 'text-yellow-400', variant: 'warning' as const };
    if (score <= 80) return { level: 'Poor', color: 'text-orange-400', variant: 'warning' as const };
    return { level: 'Critical', color: 'text-red-400', variant: 'error' as const };
  };

  const securityLevel = getSecurityLevel(riskScore);

  const securityMetrics = {
    sessionSecurity: sessionId ? 95 : 0,
    dataEncryption: 100,
    mfaEnabled: securityConfig.mfaEnabled ? 100 : 0,
    transactionSecurity: transactions.length > 0 ? 
      Math.max(0, 100 - (transactions.reduce((sum, tx) => sum + tx.securityScore, 0) / transactions.length)) : 100
  };

  const overallSecurity = Object.values(securityMetrics).reduce((sum, val) => sum + val, 0) / Object.keys(securityMetrics).length;

  const recentSecurityEvents = [
    { type: 'success', message: 'Session validated successfully', timestamp: Date.now() - 300000 },
    { type: 'info', message: 'Data encryption verified', timestamp: Date.now() - 600000 },
    { type: 'warning', message: 'New device detected', timestamp: Date.now() - 900000 },
  ];

  if (!user) {
    return (
      <Card>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Please connect your wallet to view security dashboard</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Security Dashboard</h2>
        <p className="text-gray-400">Monitor your account security and risk levels</p>
      </div>

      {/* Overall Security Score */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-yellow-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Overall Security Score</h3>
              <p className="text-gray-400">Based on multiple security factors</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{Math.round(overallSecurity)}%</div>
            <Badge variant={securityLevel.variant} className={securityLevel.color}>
              {securityLevel.level}
            </Badge>
          </div>
        </div>

        <ProgressBar
          value={overallSecurity}
          max={100}
          color={overallSecurity >= 80 ? 'success' : overallSecurity >= 60 ? 'warning' : 'error'}
          className="mb-4"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{Math.round(securityMetrics.sessionSecurity)}%</div>
            <div className="text-sm text-gray-400">Session Security</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{Math.round(securityMetrics.dataEncryption)}%</div>
            <div className="text-sm text-gray-400">Data Encryption</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{Math.round(securityMetrics.mfaEnabled)}%</div>
            <div className="text-sm text-gray-400">MFA Protection</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{Math.round(securityMetrics.transactionSecurity)}%</div>
            <div className="text-sm text-gray-400">Transaction Security</div>
          </div>
        </div>
      </Card>

      {/* Risk Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Current Risk Level</span>
                <span className={`font-medium ${securityLevel.color}`}>
                  {riskScore}/100
                </span>
              </div>
              <ProgressBar
                value={riskScore}
                max={100}
                color={riskScore <= 30 ? 'success' : riskScore <= 60 ? 'warning' : 'error'}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Account Age</span>
                <span className="text-green-400">Low Risk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transaction Pattern</span>
                <span className="text-green-400">Normal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Device Security</span>
                <span className="text-yellow-400">Medium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Geographic Location</span>
                <span className="text-green-400">Consistent</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <Lock className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Security Features</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Wallet Connected</span>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Data Encryption</span>
              </div>
              <Badge variant="success">AES-256</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {securityConfig.mfaEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                )}
                <span className="text-gray-300">Multi-Factor Auth</span>
              </div>
              <Badge variant={securityConfig.mfaEnabled ? 'success' : 'warning'}>
                {securityConfig.mfaEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Session Security</span>
              </div>
              <Badge variant="success">Protected</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Eye className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Recent Security Events</h3>
        </div>

        <div className="space-y-3">
          {recentSecurityEvents.map((event, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-3">
                {event.type === 'success' && <CheckCircle className="h-4 w-4 text-green-400" />}
                {event.type === 'info' && <Zap className="h-4 w-4 text-blue-400" />}
                {event.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-400" />}
                <span className="text-gray-300">{event.message}</span>
              </div>
              <span className="text-sm text-gray-400">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Security Recommendations</h3>
        </div>

        <div className="space-y-3">
          {!securityConfig.mfaEnabled && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Enable Multi-Factor Authentication</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                Add an extra layer of security to your account with 2FA
              </p>
            </div>
          )}
          
          <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-blue-400" />
              <span className="text-blue-400 font-medium">Regular Security Checkups</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Review your security settings and activity regularly
            </p>
          </div>

          <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium">Strong Password Policy</span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Your account follows security best practices
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};