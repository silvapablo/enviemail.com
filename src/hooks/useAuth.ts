import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/authService';
import { User } from '../services/supabaseService';

interface UseAuthReturn {
  user: User | null;
  walletAddress: string | null;
  isAuthenticated: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        const isAuth = await AuthService.isAuthenticated();
        const storedWallet = AuthService.getStoredWalletAddress();
        
        if (currentUser && isAuth) {
          setUser(currentUser);
          setWalletAddress(storedWallet);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { user: authUser, address } = await AuthService.connectWallet();
      setUser(authUser);
      setWalletAddress(address);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await AuthService.disconnectWallet();
      setUser(null);
      setWalletAddress(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const refreshedUser = await AuthService.refreshUser();
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } catch (error) {
      console.error('User refresh failed:', error);
    }
  }, []);

  return {
    user,
    walletAddress,
    isAuthenticated,
    isConnecting,
    connectWallet,
    disconnect,
    refreshUser
  };
};