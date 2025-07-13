import React, { useState, useEffect } from 'react';
import { Mail, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useData } from '../../hooks/useData';

export const CampaignStatsCard: React.FC = () => {
  const { user } = useAuth();
  const { campaigns, fetchCampaigns, loading } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCampaigns(user.id);
    }
  }, [user, fetchCampaigns]);

  const handleRefresh = async () => {
    if (!user) return;
    
    setIsRefreshing(true);
    try {
      await fetchCampaigns(user.id);
    } catch (error) {
      console.error('Failed to refresh campaigns:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <div className="text-center py-8">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Connect wallet to view campaigns</p>
        </div>
      </Card>
    );
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalCampaigns = campaigns.length;
  const avgOpenRate = totalCampaigns > 0 ? 
    campaigns.reduce((sum, c) => sum + c.open_rate, 0) / totalCampaigns : 0;
  const avgClickRate = totalCampaigns > 0 ? 
    campaigns.reduce((sum, c) => sum + c.click_rate, 0) / totalCampaigns : 0;
  const totalSpamReports = campaigns.reduce((sum, c) => sum + c.spam_reports, 0);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Mail className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Campaign Performance</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success">{activeCampaigns} Active</Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalCampaigns}</div>
            <div className="text-sm text-gray-400">Total Campaigns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{user.successful_campaigns}</div>
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
              {totalSpamReports} Total
            </span>
          </div>
        </div>

        {totalCampaigns === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">No campaigns yet</p>
            <p className="text-gray-500 text-xs">Create your first campaign to see stats</p>
          </div>
        )}
      </div>
    </Card>
  );
};