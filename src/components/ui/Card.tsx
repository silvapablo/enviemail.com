import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <div
      className={cn(
        'bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6',
        'shadow-lg shadow-black/20',
        hover && 'hover:bg-gray-900/70 hover:border-gray-700 transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
};