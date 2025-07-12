import React from 'react';
import { Mail, Shield, Coins, TrendingUp, Users, Zap, Award, Globe } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface LandingProps {
  onGetStarted: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl">
                <Mail className="h-12 w-12 text-black" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              EmailChain
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Protocol
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The first blockchain dedicated to email reputation. Revolutionize email marketing through tokenized trust and decentralized validation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="text-lg px-8 py-4"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4"
              >
                Read Whitepaper
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">8,547</div>
            <div className="text-gray-400">Active Validators</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">2.3M</div>
            <div className="text-gray-400">Emails Validated</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">$247M</div>
            <div className="text-gray-400">Market Cap</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">18.5%</div>
            <div className="text-gray-400">Staking APY</div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Why EmailChain Protocol?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform email marketing with blockchain technology, ensuring trust, transparency, and better deliverability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card hover className="text-center">
            <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Reputation System</h3>
            <p className="text-gray-400">
              Build and maintain your email reputation through blockchain verification and community validation.
            </p>
          </Card>

          <Card hover className="text-center">
            <div className="p-4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Decentralized Validation</h3>
            <p className="text-gray-400">
              Community-driven email validation ensures quality and reduces spam through consensus mechanisms.
            </p>
          </Card>

          <Card hover className="text-center">
            <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Coins className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Token Economics</h3>
            <p className="text-gray-400">
              Stake TRUST tokens to participate in validation and earn rewards for maintaining network quality.
            </p>
          </Card>

          <Card hover className="text-center">
            <div className="p-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Better Deliverability</h3>
            <p className="text-gray-400">
              Higher reputation scores lead to better email deliverability and engagement rates.
            </p>
          </Card>

          <Card hover className="text-center">
            <div className="p-4 bg-gradient-to-r from-red-400 to-rose-500 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Smart Contracts</h3>
            <p className="text-gray-400">
              Automated campaign execution and reward distribution through transparent smart contracts.
            </p>
          </Card>

          <Card hover className="text-center">
            <div className="p-4 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Global Network</h3>
            <p className="text-gray-400">
              Join a worldwide network of validators and marketers building the future of email.
            </p>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A simple three-step process to revolutionize your email marketing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-black">1</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Stake & Register</h3>
            <p className="text-gray-400">
              Connect your wallet, stake TRUST tokens, and register as a sender or validator in the network.
            </p>
          </div>

          <div className="text-center">
            <div className="p-4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-black">2</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Create & Validate</h3>
            <p className="text-gray-400">
              Create email campaigns or validate others' emails. Build reputation through quality interactions.
            </p>
          </div>

          <div className="text-center">
            <div className="p-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-black">3</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Earn & Grow</h3>
            <p className="text-gray-400">
              Earn rewards, improve your reputation, and benefit from better deliverability and network effects.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center">
          <div className="py-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Email Marketing?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of marketers and validators building the future of email on the blockchain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="text-lg px-8 py-4"
              >
                <Mail className="h-5 w-5 mr-2" />
                Launch Dashboard
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onGetStarted}
                className="text-lg px-8 py-4"
              >
                <Award className="h-5 w-5 mr-2" />
                Become a Validator
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};