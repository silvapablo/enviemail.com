export interface User {
  id: string;
  address: string;
  reputation: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Legendary';
  tokenBalance: number;
  stakedBalance: number;
  isValidator: boolean;
  joinedDate: string;
  totalCampaigns: number;
  successfulCampaigns: number;
  validationAccuracy?: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  targetAudience: number;
  stakeAmount: number;
  emailsSent: number;
  openRate: number;
  clickRate: number;
  spamReports: number;
  reputationImpact: number;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
}

export interface Validator {
  id: string;
  address: string;
  stake: number;
  accuracy: number;
  validationsCompleted: number;
  region: string;
  specialization: string[];
  isActive: boolean;
  totalRewards: number;
  joinedDate: string;
}

export interface EmailValidation {
  id: string;
  content: string;
  sender: string;
  subject: string;
  targetAudience: number;
  timestamp: string;
  validatorVotes: {
    legitimate: number;
    spam: number;
    total: number;
  };
  status: 'pending' | 'validated' | 'rejected';
  consensusReached: boolean;
}

export interface TokenStats {
  price: number;
  priceChange24h: number;
  marketCap: number;
  totalSupply: number;
  circulatingSupply: number;
  burnedToday: number;
  stakingAPY: number;
}

export interface NetworkStats {
  totalValidators: number;
  activeValidators: number;
  emailsValidatedToday: number;
  totalReputationPoints: number;
  averageReputationScore: number;
  totalStaked: number;
  totalBurned: number;
}

export interface StakingOption {
  duration: number;
  apy: number;
  multiplier: number;
  lockPeriod: string;
}

export interface Transaction {
  id: string;
  type: 'stake' | 'unstake' | 'campaign' | 'validation' | 'reward' | 'penalty';
  amount: number;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed: number;
  description: string;
}

export interface ReputationHistory {
  date: string;
  score: number;
  change: number;
  reason: string;
}