import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, SecureTransaction, SecureNotification, SecurityConfig, MFAConfig } from '../types';
import { EncryptionManager } from '../security/encryption';
import { SessionManager } from '../security/sessionManager';
import { FraudDetectionEngine } from '../security/fraudDetection';

interface SecureAppState {
  // User state
  user: User | null;
  walletAddress: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  mfaConfig: MFAConfig | null;
  
  // Security state
  securityConfig: SecurityConfig;
  encryptedData: Record<string, string>;
  lastActivity: number;
  riskScore: number;
  
  // Transaction state
  transactions: SecureTransaction[];
  pendingTransactions: SecureTransaction[];
  
  // Notification state
  notifications: SecureNotification[];
  unreadCount: number;
  
  // UI state
  currentPage: string;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  setWalletAddress: (address: string) => void;
  login: (credentials: any) => Promise<boolean>;
  logout: () => void;
  
  // Security actions
  encryptSensitiveData: (key: string, data: any) => void;
  decryptSensitiveData: (key: string) => any;
  validateSession: () => Promise<boolean>;
  updateRiskScore: (delta: number) => void;
  logSecurityEvent: (event: string, details: any) => void;
  
  // Transaction actions
  addTransaction: (transaction: Omit<SecureTransaction, 'id' | 'timestamp' | 'signature'>) => Promise<void>;
  updateTransactionStatus: (id: string, status: SecureTransaction['status']) => void;
  
  // Notification actions
  addNotification: (notification: Omit<SecureNotification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // UI actions
  setCurrentPage: (page: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const ENCRYPTION_KEY = EncryptionManager.generateKey();

export const useSecureStore = create<SecureAppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      walletAddress: null,
      sessionId: null,
      isAuthenticated: false,
      mfaConfig: null,
      
      securityConfig: {
        encryptionKey: ENCRYPTION_KEY,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        maxLoginAttempts: 3,
        csrfToken: EncryptionManager.secureRandom(32),
        mfaEnabled: false,
        rateLimit: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100
        }
      },
      
      encryptedData: {},
      lastActivity: Date.now(),
      riskScore: 0,
      
      transactions: [],
      pendingTransactions: [],
      
      notifications: [],
      unreadCount: 0,
      
      currentPage: 'landing',
      loading: false,
      error: null,

      // User actions
      setUser: (user) => {
        set({ user, isAuthenticated: true, lastActivity: Date.now() });
      },

      setWalletAddress: (address) => {
        set({ walletAddress: address });
      },

      login: async (credentials) => {
        try {
          set({ loading: true, error: null });
          
          // Create secure session
          const sessionId = await SessionManager.createSession(credentials.userId, {
            ipAddress: credentials.ipAddress || '127.0.0.1',
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: {
              width: screen.width,
              height: screen.height
            }
          });

          set({ 
            sessionId, 
            isAuthenticated: true, 
            lastActivity: Date.now(),
            loading: false 
          });
          
          return true;
        } catch (error) {
          set({ error: 'Login failed', loading: false });
          return false;
        }
      },

      logout: () => {
        const { sessionId } = get();
        if (sessionId) {
          SessionManager.invalidateSession(sessionId);
        }
        
        set({
          user: null,
          walletAddress: null,
          sessionId: null,
          isAuthenticated: false,
          mfaConfig: null,
          encryptedData: {},
          transactions: [],
          pendingTransactions: [],
          notifications: [],
          unreadCount: 0,
          riskScore: 0,
          currentPage: 'landing'
        });
      },

      // Security actions
      encryptSensitiveData: (key, data) => {
        const { securityConfig, encryptedData } = get();
        const encrypted = EncryptionManager.encrypt(JSON.stringify(data), securityConfig.encryptionKey);
        set({ 
          encryptedData: { ...encryptedData, [key]: encrypted },
          lastActivity: Date.now()
        });
      },

      decryptSensitiveData: (key) => {
        const { securityConfig, encryptedData } = get();
        const encrypted = encryptedData[key];
        if (!encrypted) return null;
        
        try {
          const decrypted = EncryptionManager.decrypt(encrypted, securityConfig.encryptionKey);
          return JSON.parse(decrypted);
        } catch {
          return null;
        }
      },

      validateSession: async () => {
        const { sessionId } = get();
        if (!sessionId) return false;
        
        const isValid = await SessionManager.validateSession(sessionId);
        if (!isValid) {
          get().logout();
        } else {
          set({ lastActivity: Date.now() });
        }
        
        return isValid;
      },

      updateRiskScore: (delta) => {
        const { riskScore, sessionId } = get();
        const newRiskScore = Math.max(0, Math.min(100, riskScore + delta));
        
        set({ riskScore: newRiskScore });
        
        if (sessionId) {
          SessionManager.updateSessionRisk(sessionId, delta).catch(() => {
            // Session was invalidated due to high risk
            get().logout();
          });
        }
      },

      logSecurityEvent: (event, details) => {
        console.log(`Security Event: ${event}`, details);
        // In production, send to security monitoring system
      },

      // Transaction actions
      addTransaction: async (transactionData) => {
        const { user, transactions } = get();
        if (!user) return;

        const transaction: SecureTransaction = {
          ...transactionData,
          id: EncryptionManager.secureRandom(16),
          timestamp: Date.now(),
          signature: EncryptionManager.generateSignature(transactionData, ENCRYPTION_KEY),
          ipAddress: '127.0.0.1', // Would be real IP in production
          userAgent: navigator.userAgent,
          blockNumber: Math.floor(Math.random() * 1000000),
          confirmations: 0,
          securityScore: 0,
          riskFlags: []
        };

        // Run fraud detection
        try {
          const fraudResult = await FraudDetectionEngine.analyzeTransaction(transaction, transactions);
          transaction.securityScore = fraudResult.riskScore;
          transaction.riskFlags = fraudResult.flags;

          if (fraudResult.blocked) {
            transaction.status = 'failed';
            get().addNotification({
              userId: user.id,
              type: 'security',
              priority: 'critical',
              title: 'Transaction Blocked',
              encryptedContent: EncryptionManager.encrypt('Transaction blocked due to security concerns', ENCRYPTION_KEY),
              delivered: true,
              read: false,
              signature: EncryptionManager.generateSignature('Transaction blocked', ENCRYPTION_KEY),
              expiresAt: Date.now() + 24 * 60 * 60 * 1000
            });
          }
        } catch (error) {
          console.error('Fraud detection failed:', error);
        }

        set({ 
          transactions: [...transactions, transaction],
          lastActivity: Date.now()
        });
      },

      updateTransactionStatus: (id, status) => {
        const { transactions } = get();
        const updatedTransactions = transactions.map(tx =>
          tx.id === id ? { ...tx, status } : tx
        );
        set({ transactions: updatedTransactions });
      },

      // Notification actions
      addNotification: (notificationData) => {
        const { notifications, unreadCount } = get();
        
        const notification: SecureNotification = {
          ...notificationData,
          id: EncryptionManager.secureRandom(16),
          timestamp: Date.now()
        };

        set({ 
          notifications: [notification, ...notifications],
          unreadCount: unreadCount + 1
        });
      },

      markNotificationRead: (id) => {
        const { notifications, unreadCount } = get();
        const updatedNotifications = notifications.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        );
        const wasUnread = notifications.find(n => n.id === id && !n.read);
        
        set({ 
          notifications: updatedNotifications,
          unreadCount: wasUnread ? unreadCount - 1 : unreadCount
        });
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      // UI actions
      setCurrentPage: (page) => {
        set({ currentPage: page, lastActivity: Date.now() });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      setError: (error) => {
        set({ error });
      }
    }),
    {
      name: 'emailchain-secure-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        currentPage: state.currentPage,
        walletAddress: state.walletAddress,
        // Encrypted data is safe to persist
        encryptedData: state.encryptedData
      })
    }
  )
);