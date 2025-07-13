import React, { useState, useEffect } from 'react';
import { Globe, Users, Zap, Flame, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useData } from '../../hooks/useData';

export const NetworkStatsCard: React.FC = () => {
  const { stats, loading } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger a refetch of network stats
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      window.location.reload(); // Force refresh for now - you can implement proper refetch
    } catch (error) {
      console.error('Failed to refresh network stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Use real data from the database or fallback to 0
  const networkStats = {
    activeValidators: stats?.networkStats?.active_validators || 0,
    emailsValidatedToday: stats?.emailsValidatedToday || 0,
    totalStaked: stats?.totalStaked || 0,
    totalBurned: stats?.networkStats?.total_burned || 0,
    averageReputationScore: stats?.networkStats?.average_reputation_score || 0
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Network Statistics</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {networkStats.activeValidators.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 flex items-center justify-center">
              <Users className="h-4 w-4 mr-1" />
              Active Validators
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {networkStats.emailsValidatedToday > 1000000 ? 
                `${(networkStats.emailsValidatedToday / 1000000).toFixed(1)}M` :
                networkStats.emailsValidatedToday.toLocaleString()
              }
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
              {networkStats.totalStaked > 1000000 ? 
                `${(networkStats.totalStaked / 1000000).toFixed(1)}M` :
                networkStats.totalStaked.toLocaleString()
              } TRUST
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Avg. Reputation</span>
            <span className="text-sm font-medium text-white">
              {networkStats.averageReputationScore.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400 flex items-center">
              <Flame className="h-4 w-4 mr-1 text-red-400" />
              Total Burned
            </span>
            <span className="text-sm font-medium text-red-400">
              {networkStats.totalBurned.toLocaleString()} TRUST
            </span>
          </div>
        </div>

        {Object.values(networkStats).every(val => val === 0) && (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">Loading network data...</p>
          </div>
        )}
      </div>
    </Card>
  );
};