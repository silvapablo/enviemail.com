import React from 'react';
import { Coins, TrendingUp, Lock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { mockUser, mockTokenStats } from '../../data/mockData';

export const TokenBalanceCard: React.FC = () => {
  const usdValue = mockUser.tokenBalance * mockTokenStats.price;
  const stakedUsdValue = mockUser.stakedBalance * mockTokenStats.price;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Token Balance</h3>
        </div>
        <Badge variant="success" className="flex items-center space-x-1">
          <TrendingUp className="h-3 w-3" />
          <span>+{mockTokenStats.priceChange24h.toFixed(1)}%</span>
        </Badge>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-3xl font-bold text-white">
            {mockUser.tokenBalance.toLocaleString()} TRUST
          </div>
          <div className="text-sm text-gray-400">
            ${usdValue.toLocaleString()} USD
          </div>
        </div>

        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 flex items-center">
              <Lock className="h-4 w-4 mr-1" />
              Staked
            </span>
            <span className="text-sm text-green-400">
              {mockTokenStats.stakingAPY}% APY
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            {mockUser.stakedBalance.toLocaleString()} TRUST
          </div>
          <div className="text-sm text-gray-400">
            ${stakedUsdValue.toLocaleString()} USD
          </div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-white">
            ${mockTokenStats.price.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">Current Price</div>
        </div>
      </div>
    </Card>
  );
};