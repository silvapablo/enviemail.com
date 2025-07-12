import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card } from '../ui/Card';

export const ReputationChart: React.FC = () => {
  // Define reputation history locally
  const mockReputationHistory = [
    { date: '2024-01-01', score: 850, change: 25 },
    { date: '2024-01-02', score: 875, change: 30 },
    { date: '2024-01-03', score: 905, change: 15 },
    { date: '2024-01-04', score: 920, change: -5 },
    { date: '2024-01-05', score: 915, change: 40 },
    { date: '2024-01-06', score: 955, change: 20 },
    { date: '2024-01-07', score: 975, change: 25 }
  ];
  
  const maxScore = Math.max(...mockReputationHistory.map(h => h.score));
  const minScore = Math.min(...mockReputationHistory.map(h => h.score));
  const range = maxScore - minScore;

  return (
    <Card>
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="h-5 w-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">Reputation History</h3>
      </div>

      <div className="space-y-4">
        <div className="relative h-48">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Chart line */}
            <polyline
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={mockReputationHistory.map((point, index) => {
                const x = (index / (mockReputationHistory.length - 1)) * 380 + 10;
                const y = 190 - ((point.score - minScore) / range) * 180;
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
            
            {/* Data points */}
            {mockReputationHistory.map((point, index) => {
              const x = (index / (mockReputationHistory.length - 1)) * 380 + 10;
              const y = 190 - ((point.score - minScore) / range) * 180;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#fbbf24"
                  stroke="#1f2937"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockReputationHistory.slice(-4).map((point, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-bold text-white">
                {point.score.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">
                {new Date(point.date).toLocaleDateString()}
              </div>
              <div className={`text-xs ${point.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {point.change > 0 ? '+' : ''}{point.change}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};