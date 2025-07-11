import React from 'react';
import { ReputationCard } from '../components/dashboard/ReputationCard';
import { TokenBalanceCard } from '../components/dashboard/TokenBalanceCard';
import { CampaignStatsCard } from '../components/dashboard/CampaignStatsCard';
import { NetworkStatsCard } from '../components/dashboard/NetworkStatsCard';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's your EmailChain Protocol overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReputationCard />
        <TokenBalanceCard />
        <CampaignStatsCard />
        <NetworkStatsCard />
      </div>
    </div>
  );
};