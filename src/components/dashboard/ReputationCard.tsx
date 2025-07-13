import React from 'react';
import { TrendingUp, Award, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '../../hooks/useAuth';

export const ReputationCard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Connect wallet to view reputation</p>
        </div>
      </Card>
    );
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Legendary': return 'from-purple-500 to-pink-500';
      case 'Diamond': return 'from-blue-400 to-cyan-400';
      case 'Gold': return 'from-yellow-400 to-orange-400';
      case 'Silver': return 'from-gray-300 to-gray-500';
      case 'Bronze': return 'from-orange-600 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getNextTierScore = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 3000;
      case 'Silver': return 5000;
      case 'Gold': return 7000;
      case 'Diamond': return 9000;
      case 'Legendary': return 10000;
      default: return 3000;
    }
  };

  const nextTierScore = getNextTierScore(user.tier);
  const progressToNextTier = (user.reputation_score / nextTierScore) * 100;

  // Calculate weekly growth (would come from reputation history in real implementation)
  const weeklyGrowth = Math.floor(user.reputation_score * 0.05); // Placeholder calculation
  const accuracy = user.validation_accuracy || 0;

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
            {user.reputation_score.toLocaleString()}
          </div>
          <Badge className={`bg-gradient-to-r ${getTierColor(user.tier)} text-white`}>
            <Award className="h-4 w-4 mr-1" />
            {user.tier} Tier
          </Badge>
        </div>

        {user.tier !== 'Legendary' && (
          <ProgressBar
            value={user.reputation_score}
            max={nextTierScore}
            showLabel
            label={`Progress to ${user.tier === 'Bronze' ? 'Silver' : 
                   user.tier === 'Silver' ? 'Gold' : 
                   user.tier === 'Gold' ? 'Diamond' : 'Legendary'} Tier`}
            color="primary"
          />
        )}

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">+{weeklyGrowth}</div>
            <div className="text-sm text-gray-400">This Week</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">{accuracy.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 mr-1" />
              +{Math.floor(weeklyGrowth / user.reputation_score * 100)}%
            </div>
            <div className="text-sm text-gray-400">Growth</div>
          </div>
        </div>
      </div>
    </Card>
  );
};