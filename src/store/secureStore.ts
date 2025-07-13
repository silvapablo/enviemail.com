import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../services/supabaseService';
import { SecureTransaction } from '../security/types';

interface SecureStoreState {
  // User state
  user: User | null;
  walletAddress: string | null;
  isAuthenticated: boolean;
  
  // Transaction state
  transactions: SecureTransaction[];
  
  // Security state
  sessionId: string | null;
  lastActivity: number;
  
  // Actions
  setUser: (user: User | null) => void;
  setWalletAddress: (address: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  addTransaction: (transaction: Omit<SecureTransaction, 'id' | 'timestamp'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<SecureTransaction>) => void;
  setSessionId: (sessionId: string | null) => void;
  updateLastActivity: () => void;
  clearStore: () => void;
}

export const useSecureStore = create<SecureStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      walletAddress: null,
      isAuthenticated: false,
      transactions: [],
      sessionId: null,
      lastActivity: Date.now(),

      // Actions
      setUser: (user) => {
        set({ user });
        if (user) {
          set({ isAuthenticated: true });
        }
      },

      setWalletAddress: (address) => {
        set({ walletAddress: address });
      },

      setAuthenticated: (authenticated) => {
        set({ isAuthenticated: authenticated });
        if (!authenticated) {
          set({ user: null, walletAddress: null, sessionId: null });
        }
      },

      addTransaction: async (transactionData) => {
        const transaction: SecureTransaction = {
          ...transactionData,
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          securityScore: transactionData.securityScore || 0,
          riskFlags: transactionData.riskFlags || []
        };

        set((state) => ({
          transactions: [transaction, ...state.transactions].slice(0, 100) // Keep last 100 transactions
        }));

        // In a real implementation, this would also save to the database
        console.log('Transaction added to store:', transaction.id);
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map(tx =>
            tx.id === id ? { ...tx, ...updates } : tx
          )
        }));
      },

      setSessionId: (sessionId) => {
        set({ sessionId });
      },

      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      clearStore: () => {
        set({
          user: null,
          walletAddress: null,
          isAuthenticated: false,
          transactions: [],
          sessionId: null,
          lastActivity: Date.now()
        });
      }
    }),
    {
      name: 'emailchain-secure-store',
      partialize: (state) => ({
        // Only persist non-sensitive data
        walletAddress: state.walletAddress,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity
      })
    }
  )
);

// Utility functions for external use
export const getStoredUser = () => useSecureStore.getState().user;
export const getStoredWalletAddress = () => useSecureStore.getState().walletAddress;
export const isUserAuthenticated = () => useSecureStore.getState().isAuthenticated;