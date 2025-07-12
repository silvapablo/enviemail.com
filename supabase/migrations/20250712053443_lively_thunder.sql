-- EmailChain Protocol Database Schema
-- Execute no Supabase Dashboard > SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  reputation_score INTEGER DEFAULT 0,
  trust_tokens BIGINT DEFAULT 1000,
  tier TEXT DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Diamond', 'Legendary')),
  is_validator BOOLEAN DEFAULT false,
  total_campaigns INTEGER DEFAULT 0,
  successful_campaigns INTEGER DEFAULT 0,
  validation_accuracy NUMERIC(5,2) DEFAULT 0.0,
  total_validations INTEGER DEFAULT 0,
  correct_validations INTEGER DEFAULT 0,
  total_rewards_earned BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email campaigns table  
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  target_audience INTEGER NOT NULL DEFAULT 1,
  emails_sent INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2) DEFAULT 0.0,
  click_rate NUMERIC(5,2) DEFAULT 0.0,
  spam_reports INTEGER DEFAULT 0,
  reputation_impact INTEGER DEFAULT 0,
  stake_amount BIGINT DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  reward_pool BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Email validations table
CREATE TABLE IF NOT EXISTS email_validations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  validator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_content TEXT NOT NULL,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  target_audience INTEGER NOT NULL,
  validation_result TEXT NOT NULL CHECK (validation_result IN ('legitimate', 'spam', 'suspicious')),
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  ai_analysis JSONB,
  human_verified BOOLEAN DEFAULT false,
  reward_earned BIGINT DEFAULT 0,
  validator_votes JSONB DEFAULT '{"spam": 0, "total": 0, "legitimate": 0}'::jsonb,
  consensus_reached BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stake', 'unstake', 'campaign', 'validation', 'reward', 'penalty', 'transfer')),
  blockchain_tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  gas_used NUMERIC(10,6) DEFAULT 0,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stakes table
CREATE TABLE IF NOT EXISTS user_stakes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  staked_amount BIGINT NOT NULL,
  stake_type TEXT NOT NULL CHECK (stake_type IN ('validator', 'sender', 'general')),
  duration_months INTEGER DEFAULT 0,
  apy NUMERIC(5,2) DEFAULT 18.5,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reputation history table
CREATE TABLE IF NOT EXISTS reputation_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  validation_id UUID REFERENCES email_validations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stakes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public user info viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can view own data" ON users FOR ALL USING (
  (uid())::text = wallet_address OR 
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = users.id)
);

CREATE POLICY "Public campaigns view" ON email_campaigns FOR SELECT USING (true);
CREATE POLICY "Users can create campaigns" ON email_campaigns FOR INSERT WITH CHECK (
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = email_campaigns.sender_id)
);
CREATE POLICY "Users can update own campaigns" ON email_campaigns FOR UPDATE USING (
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = email_campaigns.sender_id)
);

CREATE POLICY "Public validations view" ON email_validations FOR SELECT USING (true);
CREATE POLICY "Validators can create validations" ON email_validations FOR INSERT WITH CHECK (
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = email_validations.validator_id)
);
CREATE POLICY "Validators can update own validations" ON email_validations FOR UPDATE USING (
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = email_validations.validator_id)
);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = transactions.from_user_id) OR
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = transactions.to_user_id)
);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = transactions.from_user_id)
);

CREATE POLICY "Users can manage own stakes" ON user_stakes FOR ALL USING (
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = user_stakes.user_id)
);

CREATE POLICY "Users can view own reputation history" ON reputation_history FOR SELECT USING (
  (uid())::text IN (SELECT wallet_address FROM users WHERE id = reputation_history.user_id) OR true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_sender ON email_campaigns(sender_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON email_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_validations_campaign ON email_validations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_validations_validator ON email_validations(validator_id);
CREATE INDEX IF NOT EXISTS idx_validations_status ON email_validations(status);
CREATE INDEX IF NOT EXISTS idx_validations_created ON email_validations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stakes_user ON user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_stakes_status ON user_stakes(status);
CREATE INDEX IF NOT EXISTS idx_reputation_user ON reputation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_created ON reputation_history(created_at DESC);

-- Functions for business logic
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Update tier based on reputation score
  IF NEW.reputation_score >= 9000 THEN
    NEW.tier = 'Legendary';
  ELSIF NEW.reputation_score >= 7000 THEN
    NEW.tier = 'Diamond';
  ELSIF NEW.reputation_score >= 5000 THEN
    NEW.tier = 'Gold';
  ELSIF NEW.reputation_score >= 3000 THEN
    NEW.tier = 'Silver';
  ELSE
    NEW.tier = 'Bronze';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_reputation_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.reputation_score != NEW.reputation_score THEN
    INSERT INTO reputation_history (
      user_id,
      old_score,
      new_score,
      change_amount,
      reason
    ) VALUES (
      NEW.id,
      OLD.reputation_score,
      NEW.reputation_score,
      NEW.reputation_score - OLD.reputation_score,
      'Reputation updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's campaign count
  UPDATE users 
  SET total_campaigns = total_campaigns + 1,
      updated_at = NOW()
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_user_tier
  BEFORE UPDATE OF reputation_score ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tier();

CREATE TRIGGER trigger_log_reputation_change
  AFTER UPDATE OF reputation_score ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_reputation_change();

CREATE TRIGGER trigger_update_campaign_stats
  AFTER INSERT ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();