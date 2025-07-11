import React from 'react';
import { StakingCalculator } from '../components/staking/StakingCalculator';

export const Staking: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Staking</h1>
        <p className="text-gray-400">Stake your TRUST tokens to earn rewards and support the network</p>
      </div>

      <StakingCalculator />
    </div>
  );
};