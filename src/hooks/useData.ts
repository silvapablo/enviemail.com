import { useState, useEffect, useCallback } from 'react';
import { DatabaseService, EmailCampaign, EmailValidation, Transaction, NetworkStats, TokenStats } from '../services/supabaseService';

interface UseDataReturn {
  campaigns: EmailCampaign[];
  pendingValidations: EmailValidation[];
  transactions: Transaction[];
  stats: {
    networkStats?: NetworkStats;
    tokenStats?: TokenStats;
    emailsValidatedToday?: number;
    totalStaked?: number;
    tokenPrice?: number;
    priceChange24h?: number;
    stakingAPY?: number;
  };
  loading: boolean;
  error: string | null;
  fetchCampaigns: (userId?: string) => Promise<void>;
  fetchValidations: () => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
  updateValidation: (id: string, updates: Partial<EmailValidation>) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useData = (): UseDataReturn => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [pendingValidations, setPendingValidations] = useState<EmailValidation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<UseDataReturn['stats']>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const campaignData = await DatabaseService.getCampaigns(50, userId);
      setCampaigns(campaignData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch campaigns';
      setError(errorMessage);
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchValidations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const validationData = await DatabaseService.getPendingValidations(20);
      setPendingValidations(validationData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch validations';
      setError(errorMessage);
      console.error('Failed to fetch validations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const transactionData = await DatabaseService.getTransactionsByUser(userId, 50);
      setTransactions(transactionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(errorMessage);
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateValidation = useCallback(async (id: string, updates: Partial<EmailValidation>) => {
    try {
      setError(null);
      await DatabaseService.updateValidation(id, updates);
      // Update local state
      setPendingValidations(prev => 
        prev.map(validation => 
          validation.id === id ? { ...validation, ...updates } : validation
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update validation';
      setError(errorMessage);
      console.error('Failed to update validation:', err);
      throw err;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [networkStats, tokenStats] = await Promise.all([
        DatabaseService.getNetworkStats(),
        DatabaseService.getTokenStats()
      ]);

      setStats({
        networkStats,
        tokenStats,
        emailsValidatedToday: networkStats.emails_validated_today,
        totalStaked: networkStats.total_staked,
        tokenPrice: tokenStats.price,
        priceChange24h: tokenStats.price_change_24h,
        stakingAPY: tokenStats.staking_apy
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Set default values if fetch fails
      setStats({
        emailsValidatedToday: 0,
        totalStaked: 0,
        tokenPrice: 0,
        priceChange24h: 0,
        stakingAPY: 18.5
      });
    }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([
      fetchCampaigns(),
      fetchValidations(),
      fetchStats()
    ]);
  }, [fetchCampaigns, fetchValidations, fetchStats]);

  useEffect(() => {
    // Initial data fetch
    refetch();
  }, [refetch]);

  return {
    campaigns,
    pendingValidations,
    transactions,
    stats,
    loading,
    error,
    fetchCampaigns,
    fetchValidations,
    fetchTransactions,
    updateValidation,
    refetch
  };
};