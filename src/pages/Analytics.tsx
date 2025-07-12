import React from 'react';
import { BarChart3, PieChart, TrendingUp, Globe } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { ReputationChart } from '../components/analytics/ReputationChart';
import { useData } from '../hooks/useData';

export const Analytics: React.FC = () => {
  const { stats, loading } = useData();

  // Default values for display while loading or if data is unavailable
  const networkStats = {
    emailsValidatedToday: stats?.emailsValidatedToday || 1250000,
    totalStaked: stats?.totalStaked || 45000000,
    uptime: 98.7,
    avgResponseTime: 2.3,
    validationAccuracy: 97.3
  };

  const tokenStats = {
    price: stats?.tokenPrice || 0.85,
    priceChange24h: stats?.priceChange24h || 12.4,
    stakingAPY: stats?.stakingAPY || 18.5
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-gray-400">Network insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Network Health</h3>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">98.7%</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">2.3s</div>
              <div className="text-sm text-gray-400">Avg Response</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Token Metrics</h3>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                ${tokenStats.price.toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">TRUST Price</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                +{tokenStats.priceChange24h.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">24h Change</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Validation Stats</h3>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {(networkStats.emailsValidatedToday / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-400">Emails Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{networkStats.validationAccuracy}%</div>
              <div className="text-sm text-gray-400">Accuracy</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Staking Pool</h3>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {(networkStats.totalStaked / 1000000).toFixed(0)}M
              </div>
              <div className="text-sm text-gray-400">Total Staked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {tokenStats.stakingAPY.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg APY</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReputationChart />
        
        <Card>
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Global Distribution</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">45%</div>
                <div className="text-sm text-gray-400">North America</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">32%</div>
                <div className="text-sm text-gray-400">Europe</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">18%</div>
                <div className="text-sm text-gray-400">Asia Pacific</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">5%</div>
                <div className="text-sm text-gray-400">Other</div>
              </div>
            </div>
            <div className="text-center text-gray-400">
              Validator distribution across regions
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};