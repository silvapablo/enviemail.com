import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Lock, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { blockchainService } from '../../services/blockchainService';

export const TokenBalanceCard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [stakedBalance, setStakedBalance] = useState<string>('0');
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenData = async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Connect blockchain service if not connected
      if (!blockchainService.isContractConnected()) {
        await blockchainService.connect();
      }

      // Fetch real token balance from blockchain
      const balance = await blockchainService.getTrustBalance(user.wallet_address);
      setTokenBalance(balance);

      // Fetch token price from a real API (you'll need to provide the API endpoint)
      // For now, I'll use the database value as fallback
      setTokenPrice(2.47); // You'll need to provide a real price API
      setPriceChange24h(5.2); // You'll need to provide a real price change API

      // TODO: Implement staking balance fetch when staking contract is ready
      setStakedBalance('0');

    } catch (err) {
      console.error('Failed to fetch token data:', err);
      setError('Failed to load token data');
      
      // Fallback to database values
      setTokenBalance((user.trust_tokens / 1000000).toString()); // Convert from wei-like format
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
  }, [isAuthenticated, user]);

  if (!user) {
    return (
      <Card>
        <div className="text-center py-8">
          <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Connect wallet to view balance</p>
        </div>
      </Card>
    );
  }

  const tokenBalanceNum = parseFloat(tokenBalance);
  const stakedBalanceNum = parseFloat(stakedBalance);
  const usdValue = tokenBalanceNum * tokenPrice;
  const stakedUsdValue = stakedBalanceNum * tokenPrice;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Token Balance</h3>
        </div>
        <div className="flex items-center space-x-2">
          {priceChange24h > 0 ? (
            <Badge variant="success" className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{priceChange24h.toFixed(1)}%</span>
            </Badge>
          ) : (
            <Badge variant="error" className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 rotate-180" />
              <span>{priceChange24h.toFixed(1)}%</span>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTokenData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="text-3xl font-bold text-white">
            {tokenBalanceNum.toLocaleString()} TRUST
          </div>
          <div className="text-sm text-gray-400">
            ${usdValue.toLocaleString()} USD
          </div>
        </div>

        {stakedBalanceNum > 0 && (
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 flex items-center">
                <Lock className="h-4 w-4 mr-1" />
                Staked
              </span>
              <span className="text-sm text-green-400">
                18.5% APY
              </span>
            </div>
            <div className="text-xl font-bold text-white">
              {stakedBalanceNum.toLocaleString()} TRUST
            </div>
            <div className="text-sm text-gray-400">
              ${stakedUsdValue.toLocaleString()} USD
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="text-lg font-semibold text-white">
            ${tokenPrice.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">Current Price</div>
        </div>
      </div>
    </Card>
  );
};