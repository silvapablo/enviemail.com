import React from 'react';
import { Calendar, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Campaign } from '../../types';

interface CampaignCardProps {
  campaign: Campaign;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const statusVariant = {
    active: 'success' as const,
    completed: 'info' as const,
    draft: 'warning' as const,
    paused: 'error' as const
  };

  const deliveryRate = (campaign.emailsSent / campaign.targetAudience) * 100;

  return (
    <Card hover className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white truncate">{campaign.name}</h3>
        <Badge variant={statusVariant[campaign.status]} className="capitalize">
          {campaign.status}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-white">
                {campaign.targetAudience.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Target Audience</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-white">
                {campaign.stakeAmount} TRUST
              </div>
              <div className="text-xs text-gray-400">Staked</div>
            </div>
          </div>
        </div>

        <ProgressBar
          value={campaign.emailsSent}
          max={campaign.targetAudience}
          showLabel
          label="Delivery Progress"
          color="primary"
        />

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-green-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              {campaign.openRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Open Rate</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">
              {campaign.clickRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Click Rate</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {campaign.spamReports}
            </div>
            <div className="text-xs text-gray-400">Spam Reports</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(campaign.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className={`font-medium ${campaign.reputationImpact > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {campaign.reputationImpact > 0 ? '+' : ''}{campaign.reputationImpact} Rep
          </div>
        </div>
      </div>
    </Card>
  );
};