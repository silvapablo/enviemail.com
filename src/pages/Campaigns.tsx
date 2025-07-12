import React, { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CampaignCard } from '../components/campaigns/CampaignCard';
import { CreateCampaignModal } from '../components/campaigns/CreateCampaignModal';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';

export const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const { campaigns, fetchCampaigns } = useData();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchCampaigns(user.id);
    }
  }, [user, fetchCampaigns]);
  
  const filteredCampaigns = campaigns.filter(campaign => 
    statusFilter === 'all' || campaign.status === statusFilter
  );

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
          <p className="text-gray-400">Connect wallet to manage campaigns</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
          <p className="text-gray-400">Manage your email marketing campaigns</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-gray-400">Filter:</span>
        </div>
        <div className="flex space-x-2">
          {['all', 'active', 'completed', 'draft'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};