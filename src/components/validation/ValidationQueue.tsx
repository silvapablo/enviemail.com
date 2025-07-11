import React from 'react';
import { Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmailValidation } from '../../types';

interface ValidationQueueProps {
  validations: EmailValidation[];
  onValidate: (id: string, isLegitimate: boolean) => void;
}

export const ValidationQueue: React.FC<ValidationQueueProps> = ({ validations, onValidate }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Validation Queue</h2>
        <Badge variant="info">
          {validations.filter(v => v.status === 'pending').length} Pending
        </Badge>
      </div>

      <div className="space-y-4">
        {validations.map((validation) => (
          <Card key={validation.id} hover>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    {new Date(validation.timestamp).toLocaleString()}
                  </span>
                </div>
                <Badge 
                  variant={validation.status === 'validated' ? 'success' : validation.status === 'rejected' ? 'error' : 'warning'}
                  className="capitalize"
                >
                  {validation.status}
                </Badge>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {validation.subject}
                </h3>
                <div className="text-sm text-gray-400 mb-2">
                  From: {validation.sender.slice(0, 10)}...{validation.sender.slice(-8)}
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {validation.content}
                  </pre>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {validation.targetAudience.toLocaleString()} recipients
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Votes: {validation.validatorVotes.legitimate} legitimate, {validation.validatorVotes.spam} spam
                  </div>
                </div>

                {validation.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onValidate(validation.id, false)}
                      className="flex items-center space-x-1 text-red-400 hover:text-red-300"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Spam</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onValidate(validation.id, true)}
                      className="flex items-center space-x-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Legitimate</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};