import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useIntegration } from '../../hooks/useIntegration';

export const SystemStatus: React.FC = () => {
  const { healthCheck, isLoading } = useIntegration();
  const [status, setStatus] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkSystemHealth = async () => {
    try {
      const health = await healthCheck();
      setStatus(health);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  useEffect(() => {
    checkSystemHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isHealthy: boolean) => {
    if (isHealthy) {
      return <CheckCircle className="h-5 w-5 text-green-400" />;
    }
    return <XCircle className="h-5 w-5 text-red-400" />;
  };

  const getStatusBadge = (isHealthy: boolean) => {
    if (isHealthy) {
      return <Badge variant="success">Healthy</Badge>;
    }
    return <Badge variant="error">Offline</Badge>;
  };

  if (!status) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-400">Checking system status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          {status.overall ? (
            <CheckCircle className="h-6 w-6 text-green-400" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-yellow-400" />
          )}
          <h3 className="text-lg font-semibold text-white">System Status</h3>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(status.overall)}
          <Button
            onClick={checkSystemHealth}
            loading={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Supabase Status */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.supabase)}
            <div>
              <h4 className="font-medium text-white">Supabase Database</h4>
              <p className="text-sm text-gray-400">Backend data storage and real-time sync</p>
            </div>
          </div>
          {getStatusBadge(status.supabase)}
        </div>

        {/* Blockchain Status */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.blockchain)}
            <div>
              <h4 className="font-medium text-white">Blockchain Network</h4>
              <p className="text-sm text-gray-400">Polygon Amoy Testnet contracts</p>
            </div>
          </div>
          {getStatusBadge(status.blockchain)}
        </div>

        {/* OpenAI Status */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.openai)}
            <div>
              <h4 className="font-medium text-white">OpenAI GPT-4</h4>
              <p className="text-sm text-gray-400">AI-powered email analysis</p>
            </div>
          </div>
          {getStatusBadge(status.openai)}
        </div>
      </div>

      {lastCheck && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 text-center">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        </div>
      )}

      {!status.overall && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">System Issues Detected</span>
          </div>
          <p className="text-yellow-300 text-sm mt-1">
            Some services are offline. Please check your configuration and network connection.
          </p>
        </div>
      )}
    </Card>
  );
};