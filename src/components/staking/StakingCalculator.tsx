import React, { useState } from 'react';
import { Calculator, Lock, TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export const StakingCalculator: React.FC = () => {
  const { user } = useAuth();
  
  // Define staking options locally
  const stakingOptions = [
    { duration: 3, apy: 12, lockPeriod: '3 months' },
    { duration: 6, apy: 15, lockPeriod: '6 months' },
    { duration: 12, apy: 18.5, lockPeriod: '12 months' },
    { duration: 24, apy: 22, lockPeriod: '24 months' }
  ];
  
  // Define calculation function locally
  const calculateStakingRewards = (amount: number, duration: number, reputation: number) => {
    const baseApy = stakingOptions.find(opt => opt.duration === duration)?.apy || 12;
    const reputationBonus = Math.floor(reputation / 1000) * 2;
    const totalApy = baseApy + reputationBonus;
    return (amount * totalApy) / 100;
  };
  
  const [amount, setAmount] = useState('10000');
  const [duration, setDuration] = useState(12);
  const [isStaking, setIsStaking] = useState(false);

  const selectedOption = stakingOptions.find(opt => opt.duration === duration);
  const stakingAmount = parseFloat(amount) || 0;
  const annualRewards = calculateStakingRewards(stakingAmount, duration, user?.reputation_score || 0);
  const totalRewards = annualRewards * (duration / 12);

  const handleStake = () => {
    setIsStaking(true);
    // Simulate staking process
    setTimeout(() => {
      setIsStaking(false);
      alert(`Successfully staked ${stakingAmount.toLocaleString()} TRUST for ${duration} months!`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center space-x-2 mb-6">
          <Calculator className="h-5 w-5 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Staking Calculator</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stake Amount (TRUST)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              placeholder="Enter amount to stake"
              min="100"
              step="100"
            />
            <div className="text-sm text-gray-400 mt-1">
              Available: {user?.trust_tokens?.toLocaleString() || '0'} TRUST
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Lock Period
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {stakingOptions.map((option) => (
                <button
                  key={option.duration}
                  onClick={() => setDuration(option.duration)}
                  className={`p-3 rounded-lg border transition-all ${
                    duration === option.duration
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {option.duration}m
                    </div>
                    <div className="text-sm text-gray-400">
                      {option.apy}% APY
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedOption && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Staking Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stake Amount:</span>
                  <span className="text-white">{stakingAmount.toLocaleString()} TRUST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lock Period:</span>
                  <span className="text-white">{selectedOption.lockPeriod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Base APY:</span>
                  <span className="text-white">{selectedOption.apy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reputation Bonus:</span>
                  <span className="text-green-400">+{Math.floor((user?.reputation_score || 0) / 1000) * 2}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total APY:</span>
                  <span className="text-yellow-400 font-bold">
                    {(selectedOption.apy + Math.floor((user?.reputation_score || 0) / 1000) * 2).toFixed(1)}%
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Annual Rewards:</span>
                    <span className="text-white">{annualRewards.toLocaleString()} TRUST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Rewards:</span>
                    <span className="text-green-400 font-bold">
                      {totalRewards.toLocaleString()} TRUST
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleStake}
            loading={isStaking}
            disabled={stakingAmount < 100 || stakingAmount > (user?.trust_tokens || 0)}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Lock className="h-4 w-4" />
            <span>Stake Tokens</span>
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Current Staking Positions</h3>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">50,000 TRUST</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="text-sm text-gray-400">
              12 months • 18.5% APY • 9,250 TRUST rewards
            </div>
            <div className="text-sm text-gray-400">
              Unlocks in 8 months
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};