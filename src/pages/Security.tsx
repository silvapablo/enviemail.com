import React, { useState } from 'react';
import { Shield, Lock, Eye, Settings } from 'lucide-react';
import { SecurityDashboard } from '../components/security/SecurityDashboard';
import { TransactionHistory } from '../components/security/TransactionHistory';
import { MFASetup } from '../components/security/MFASetup';
import { SecuritySettings } from '../components/security/SecuritySettings';

export const Security: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'mfa' | 'settings'>('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Security Dashboard', icon: Shield },
    { id: 'transactions', name: 'Transaction History', icon: Eye },
    { id: 'mfa', name: 'Multi-Factor Auth', icon: Lock },
    { id: 'settings', name: 'Security Settings', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SecurityDashboard />;
      case 'transactions':
        return <TransactionHistory />;
      case 'mfa':
        return <MFASetup />;
      case 'settings':
        return <SecuritySettings />;
      default:
        return <SecurityDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Center</h1>
        <p className="text-gray-400">Manage your account security and monitor activity</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};