import React, { useState } from 'react';
import { Shield, Award, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ValidationQueue } from '../components/validation/ValidationQueue';
import { mockPendingValidations, mockUser } from '../data/mockData';

export const Validation: React.FC = () => {
  const [validations, setValidations] = useState(mockPendingValidations);

  const handleValidate = (id: string, isLegitimate: boolean) => {
    setValidations(prev => prev.map(v => 
      v.id === id 
        ? { 
            ...v, 
            status: isLegitimate ? 'validated' : 'rejected' as const,
            validatorVotes: {
              ...v.validatorVotes,
              [isLegitimate ? 'legitimate' : 'spam']: v.validatorVotes[isLegitimate ? 'legitimate' : 'spam'] + 1,
              total: v.validatorVotes.total + 1
            }
          }
        : v
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Email Validation</h1>
        <p className="text-gray-400">Help validate emails and earn rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Validator Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <Badge variant="success">Active Validator</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Stake:</span>
              <span className="text-white">{mockUser.stakedBalance.toLocaleString()} TRUST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Accuracy:</span>
              <span className="text-green-400">{mockUser.validationAccuracy}%</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Validations:</span>
              <span className="text-white">2,847</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Week:</span>
              <span className="text-white">47</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rank:</span>
              <span className="text-yellow-400">#127</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-2 mb-4">
            <Award className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Rewards</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Earned:</span>
              <span className="text-white">12,450 TRUST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Week:</span>
              <span className="text-green-400">+245 TRUST</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending:</span>
              <span className="text-yellow-400">47 TRUST</span>
            </div>
          </div>
        </Card>
      </div>

      <ValidationQueue
        validations={validations}
        onValidate={handleValidate}
      />
    </div>
  );
};