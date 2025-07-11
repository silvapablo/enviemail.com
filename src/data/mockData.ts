import { User, Campaign, Validator, EmailValidation, TokenStats, NetworkStats, StakingOption, Transaction, ReputationHistory } from '../types';

export const mockUser: User = {
  id: '1',
  address: '0x742d35Cc6634C0532925a3b8D32C1E23D93b2A3e',
  reputation: 7250,
  tier: 'Gold',
  tokenBalance: 125000,
  stakedBalance: 50000,
  isValidator: true,
  joinedDate: '2024-01-15',
  totalCampaigns: 18,
  successfulCampaigns: 15,
  validationAccuracy: 94.2
};

// Initialize mock user in store when app loads
import { useSecureStore } from '../store/secureStore';

// This would typically be called after successful authentication
export const initializeMockUser = () => {
  const { setUser, setWalletAddress } = useSecureStore.getState();
  setUser(mockUser);
  setWalletAddress(mockUser.address);
};

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q1 Product Launch',
    status: 'active',
    targetAudience: 50000,
    stakeAmount: 50,
    emailsSent: 48500,
    openRate: 24.5,
    clickRate: 3.2,
    spamReports: 12,
    reputationImpact: 45,
    createdAt: '2024-01-20',
    scheduledAt: '2024-01-22'
  },
  {
    id: '2',
    name: 'Weekly Newsletter #47',
    status: 'completed',
    targetAudience: 25000,
    stakeAmount: 25,
    emailsSent: 25000,
    openRate: 31.2,
    clickRate: 4.8,
    spamReports: 3,
    reputationImpact: 78,
    createdAt: '2024-01-15',
    completedAt: '2024-01-16'
  },
  {
    id: '3',
    name: 'Holiday Sale Campaign',
    status: 'completed',
    targetAudience: 100000,
    stakeAmount: 100,
    emailsSent: 100000,
    openRate: 28.7,
    clickRate: 5.1,
    spamReports: 8,
    reputationImpact: 92,
    createdAt: '2024-01-10',
    completedAt: '2024-01-12'
  }
];

export const mockValidators: Validator[] = [
  {
    id: '1',
    address: '0x742d35Cc6634C0532925a3b8D32C1E23D93b2A3e',
    stake: 75000,
    accuracy: 96.8,
    validationsCompleted: 2847,
    region: 'North America',
    specialization: ['E-commerce', 'SaaS', 'Finance'],
    isActive: true,
    totalRewards: 12450,
    joinedDate: '2024-01-01'
  },
  {
    id: '2',
    address: '0x8ba1f109551bD432803012645Hf54aD5A6c2D9Bc',
    stake: 120000,
    accuracy: 98.2,
    validationsCompleted: 4521,
    region: 'Europe',
    specialization: ['Tech', 'Healthcare', 'Education'],
    isActive: true,
    totalRewards: 18750,
    joinedDate: '2023-12-15'
  }
];

export const mockPendingValidations: EmailValidation[] = [
  {
    id: '1',
    content: 'Subject: Exclusive 50% Off Flash Sale!\n\nDear Valued Customer,\n\nDon\'t miss out on our biggest sale of the year! Get 50% off on all premium products...',
    sender: '0x1234567890123456789012345678901234567890',
    subject: 'Exclusive 50% Off Flash Sale!',
    targetAudience: 15000,
    timestamp: '2024-01-22T10:30:00Z',
    validatorVotes: {
      legitimate: 8,
      spam: 2,
      total: 10
    },
    status: 'pending',
    consensusReached: false
  },
  {
    id: '2',
    content: 'Subject: Your Monthly Analytics Report\n\nHi there,\n\nYour website performance report for January is ready. Here are the key insights...',
    sender: '0x2345678901234567890123456789012345678901',
    subject: 'Your Monthly Analytics Report',
    targetAudience: 8500,
    timestamp: '2024-01-22T11:15:00Z',
    validatorVotes: {
      legitimate: 12,
      spam: 0,
      total: 12
    },
    status: 'validated',
    consensusReached: true
  }
];

export const mockTokenStats: TokenStats = {
  price: 2.47,
  priceChange24h: 5.2,
  marketCap: 247000000,
  totalSupply: 1000000000,
  circulatingSupply: 750000000,
  burnedToday: 15420,
  stakingAPY: 18.5
};

export const mockNetworkStats: NetworkStats = {
  totalValidators: 8547,
  activeValidators: 7892,
  emailsValidatedToday: 2340000,
  totalReputationPoints: 45678920,
  averageReputationScore: 5347,
  totalStaked: 375000000,
  totalBurned: 25000000
};

export const stakingOptions: StakingOption[] = [
  { duration: 3, apy: 12, multiplier: 1.0, lockPeriod: '3 months' },
  { duration: 6, apy: 15, multiplier: 1.25, lockPeriod: '6 months' },
  { duration: 12, apy: 18, multiplier: 1.5, lockPeriod: '12 months' },
  { duration: 24, apy: 22, multiplier: 2.0, lockPeriod: '24 months' }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'stake',
    amount: 10000,
    timestamp: '2024-01-22T09:30:00Z',
    status: 'confirmed',
    gasUsed: 0.0021,
    description: 'Staked 10,000 TRUST for 12 months'
  },
  {
    id: '2',
    type: 'campaign',
    amount: 50,
    timestamp: '2024-01-22T08:15:00Z',
    status: 'confirmed',
    gasUsed: 0.0018,
    description: 'Campaign stake for Q1 Product Launch'
  },
  {
    id: '3',
    type: 'reward',
    amount: 245.5,
    timestamp: '2024-01-21T23:45:00Z',
    status: 'confirmed',
    gasUsed: 0.0012,
    description: 'Validation rewards for 47 emails'
  },
  {
    id: '4',
    type: 'validation',
    amount: 12.5,
    timestamp: '2024-01-21T18:20:00Z',
    status: 'confirmed',
    gasUsed: 0.0008,
    description: 'Validation fee for email assessment'
  }
];

export const mockReputationHistory: ReputationHistory[] = [
  { date: '2024-01-01', score: 6800, change: 0, reason: 'Starting balance' },
  { date: '2024-01-05', score: 6950, change: 150, reason: 'Successful campaign completion' },
  { date: '2024-01-10', score: 7100, change: 150, reason: 'High engagement newsletter' },
  { date: '2024-01-15', score: 7050, change: -50, reason: 'Minor spam reports' },
  { date: '2024-01-20', score: 7250, change: 200, reason: 'Exceptional validation accuracy' }
];

export const getReputationTier = (score: number): User['tier'] => {
  if (score >= 9000) return 'Legendary';
  if (score >= 7000) return 'Diamond';
  if (score >= 5000) return 'Gold';
  if (score >= 3000) return 'Silver';
  return 'Bronze';
};

export const getTierColor = (tier: User['tier']): string => {
  switch (tier) {
    case 'Legendary': return 'from-purple-500 to-pink-500';
    case 'Diamond': return 'from-blue-400 to-cyan-400';
    case 'Gold': return 'from-yellow-400 to-orange-400';
    case 'Silver': return 'from-gray-300 to-gray-500';
    case 'Bronze': return 'from-orange-600 to-red-600';
    default: return 'from-gray-400 to-gray-600';
  }
};

export const calculateStakingRewards = (amount: number, duration: number, reputation: number): number => {
  const baseAPY = stakingOptions.find(opt => opt.duration === duration)?.apy || 12;
  const reputationBonus = Math.floor(reputation / 1000) * 2; // 2% per 1000 points
  const totalAPY = baseAPY + reputationBonus;
  return (amount * totalAPY) / 100;
};