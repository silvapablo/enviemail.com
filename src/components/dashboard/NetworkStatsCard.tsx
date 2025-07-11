import React from 'react';
import { Globe, Users, Zap, Flame } from 'lucide-react';
import { Card } from '../ui/Card';
import { mockNetworkStats } from '../../data/mockData';

export const NetworkStatsCard: React.FC = () => {
  return (
    <Card>
      <div className="flex items-center space-x-2 mb-4">
        <Globe className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Network Statistics</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {mockNetworkStats.activeValidators.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 flex items-center justify-center">
              <Users className="h-4 w-4 mr-1" />
              Active Validators
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {(mockNetworkStats.emailsValidatedToday / 1000000).toFixed(1)}M
            </div>
            <div className="text-sm text-gray-400 flex items-center justify-center">
              <Zap className="h-4 w-4 mr-1" />
              Emails Today
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Total Staked</span>
            <span className="text-sm font-medium text-white">
              {(mockNetworkStats.totalStaked / 1000000).toFixed(0)}M TRUST
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Avg. Reputation</span>
            <span className="text-sm font-medium text-white">
              {mockNetworkStats.averageReputationScore.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 flex items-center">
              <Flame className="h-4 w-4 mr-1 text-red-400" />
              Burned Today
            </span>
            <span className="text-sm font-medium text-red-400">
              {mockNetworkStats.totalBurned.toLocaleString()} TRUST
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};