import React from 'react';
import { TrendingUp, Award, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Tooltip } from '../ui/Tooltip';
import { mockUser, getTierColor } from '../../data/mockData';

export const ReputationCard: React.FC = () => {
  const nextTierScore = mockUser.tier === 'Gold' ? 9000 : 10000;
  const progressToNextTier = (mockUser.reputation / nextTierScore) * 100;

  return (
    <Card className="col-span-1 md:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Reputation Score</h3>
        </div>
        <Tooltip content="Reputation is calculated based on campaign performance, validation accuracy, and community trust">
          <Badge variant="info" className="cursor-help">
            ?
          </Badge>
        </Tooltip>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-2">
            {mockUser.reputation.toLocaleString()}
          </div>
          <Badge className={`bg-gradient-to-r ${getTierColor(mockUser.tier)} text-white`}>
            <Award className="h-4 w-4 mr-1" />
            {mockUser.tier} Tier
          </Badge>
        </div>

        <ProgressBar
          value={mockUser.reputation}
          max={nextTierScore}
          showLabel
          label={`Progress to ${mockUser.tier === 'Gold' ? 'Diamond' : 'Legendary'} Tier`}
          color="primary"
        />

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">+245</div>
            <div className="text-sm text-gray-400">This Week</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">94.2%</div>
            <div className="text-sm text-gray-400">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 mr-1" />
              +12%
            </div>
            <div className="text-sm text-gray-400">Growth</div>
          </div>
        </div>
      </div>
    </Card>
  );
};