import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useSecureStore } from '../../store/secureStore';
import { SecureTransaction } from '../../types';

export const TransactionHistory: React.FC = () => {
  const { transactions, user } = useSecureStore();
  const [filteredTransactions, setFilteredTransactions] = useState<SecureTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount' | 'risk'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'risk':
          aValue = a.securityScore;
          bValue = b.securityScore;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const getStatusIcon = (status: SecureTransaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: SecureTransaction['status']) => {
    switch (status) {
      case 'confirmed':
        return 'success' as const;
      case 'pending':
        return 'warning' as const;
      case 'failed':
        return 'error' as const;
      default:
        return 'default' as const;
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="error">High Risk</Badge>;
    if (score >= 60) return <Badge variant="warning">Medium Risk</Badge>;
    if (score >= 30) return <Badge variant="info">Low Risk</Badge>;
    return <Badge variant="success">Safe</Badge>;
  };

  const exportTransactions = () => {
    const csvContent = [
      ['ID', 'Hash', 'Type', 'Amount', 'Status', 'Timestamp', 'Risk Score', 'Flags'].join(','),
      ...filteredTransactions.map(tx => [
        tx.id,
        tx.hash,
        tx.type,
        tx.amount,
        tx.status,
        new Date(tx.timestamp).toISOString(),
        tx.securityScore,
        tx.riskFlags.join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <Card>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Please connect your wallet to view transaction history</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Transaction History</h2>
        <Button onClick={exportTransactions} variant="outline" className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
            >
              <option value="all">All Types</option>
              <option value="stake">Stake</option>
              <option value="unstake">Unstake</option>
              <option value="campaign">Campaign</option>
              <option value="validation">Validation</option>
              <option value="reward">Reward</option>
              <option value="penalty">Penalty</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-400"
              >
                <option value="timestamp">Date</option>
                <option value="amount">Amount</option>
                <option value="risk">Risk</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No transactions found matching your criteria</p>
            </div>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} hover>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(transaction.status)}
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={getStatusVariant(transaction.status)} className="capitalize">
                      {transaction.status}
                    </Badge>
                    {getRiskBadge(transaction.securityScore)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Amount</div>
                    <div className="text-lg font-bold text-white">
                      {transaction.amount.toLocaleString()} TRUST
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Transaction ID</div>
                    <div className="text-sm font-mono text-gray-300">
                      {transaction.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Block</div>
                    <div className="text-sm text-gray-300">
                      #{transaction.blockNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">From</div>
                    <div className="text-sm font-mono text-gray-300">
                      {transaction.from.slice(0, 10)}...{transaction.from.slice(-8)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">To</div>
                    <div className="text-sm font-mono text-gray-300">
                      {transaction.to.slice(0, 10)}...{transaction.to.slice(-8)}
                    </div>
                  </div>
                </div>

                {transaction.riskFlags.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Security Flags</div>
                    <div className="flex flex-wrap gap-2">
                      {transaction.riskFlags.map((flag, index) => (
                        <Badge key={index} variant="warning" size="sm">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div>Gas Used: {transaction.gasUsed} ETH</div>
                  <div>Confirmations: {transaction.confirmations}</div>
                  <div>Risk Score: {transaction.securityScore}/100</div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};