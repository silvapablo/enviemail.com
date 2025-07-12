import React from 'react';
import { Mail, Shield, Coins, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { NotificationCenter } from '../security/NotificationCenter';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, walletAddress, isAuthenticated, connectWallet, disconnect, isConnecting } = useAuth();

  const navigation = [
    { name: 'Dashboard', id: 'dashboard' },
    { name: 'Campaigns', id: 'campaigns' },
    { name: 'Validation', id: 'validation' },
    { name: 'Staking', id: 'staking' },
    { name: 'Analytics', id: 'analytics' },
    { name: 'Security', id: 'security' }
  ];

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <header className="bg-black/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onPageChange('landing')}
          >
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
              <Mail className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">EmailChain</h1>
              <p className="text-xs text-gray-400">Protocol</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'text-yellow-400 bg-gray-900'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* User Info & Connect */}
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user.trust_tokens.toLocaleString()} TRUST
                  </p>
                  <p className="text-xs text-gray-400">
                    {(walletAddress || user.wallet_address).slice(0, 6)}...{(walletAddress || user.wallet_address).slice(-4)}
                  </p>
                </div>
                <Badge variant="success" className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>{user.tier}</span>
                </Badge>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleConnect} 
                loading={isConnecting}
                className="flex items-center space-x-2"
              >
                <Coins className="h-4 w-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'text-yellow-400 bg-gray-900'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};