import React from 'react';
import { Mail, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { mockCampaigns } from '../../data/mockData';

export const CampaignStatsCard: React.FC = () => {
  const activeCampaigns = mockCampaigns.filter(c => c.status === 'active').length;
  const totalCampaigns = mockCampaigns.length;
  const avgOpenRate = mockCampaigns.reduce((sum, c) => sum + c.openRate, 0) / totalCampaigns;
  const avgClickRate = mockCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / totalCampaigns;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Campaign Performance</h3>
        </div>
        <Badge variant="success">{activeCampaigns} Active</Badge>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalCampaigns}</div>
            <div className="text-sm text-gray-400">Total Campaigns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">15</div>
            <div className="text-sm text-gray-400">Successful</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Open Rate</span>
            <span className="text-sm font-medium text-white flex items-center">
              <TrendingUp className="h-4 w-4 mr-1 text-green-400" />
              {avgOpenRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Click Rate</span>
            <span className="text-sm font-medium text-white">
              {avgClickRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Spam Reports</span>
            <span className="text-sm font-medium text-yellow-400 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              23 Total
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};