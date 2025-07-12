import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Real Database Types
export interface User {
  id: string
  wallet_address: string
  email?: string
  username?: string
  reputation_score: number
  trust_tokens: number
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Legendary'
  is_validator: boolean
  total_campaigns: number
  successful_campaigns: number
  validation_accuracy?: number
  created_at: string
  updated_at: string
}

export interface EmailCampaign {
  id: string
  sender_id: string
  title: string
  content: string
  subject: string
  sender_email: string
  target_audience: number
  emails_sent: number
  open_rate: number
  click_rate: number
  spam_reports: number
  reputation_impact: number
  stake_amount: number
  status: 'draft' | 'active' | 'completed' | 'paused'
  reward_pool: number
  created_at: string
  scheduled_at?: string
  completed_at?: string
}

export interface EmailValidation {
  id: string
  campaign_id: string
  validator_id: string
  email_content: string
  subject: string
  sender: string
  target_audience: number
  validation_result: 'legitimate' | 'spam' | 'suspicious'
  confidence_score: number
  ai_analysis?: any
  human_verified: boolean
  reward_earned: number
  validator_votes: {
    legitimate: number
    spam: number
    total: number
  }
  consensus_reached: boolean
  status: 'pending' | 'validated' | 'rejected'
  created_at: string
}

export interface Transaction {
  id: string
  from_user_id?: string
  to_user_id?: string
  amount: number
  transaction_type: 'stake' | 'unstake' | 'campaign' | 'validation' | 'reward' | 'penalty'
  blockchain_tx_hash?: string
  status: 'pending' | 'confirmed' | 'failed'
  gas_used: number
  description: string
  metadata?: any
  created_at: string
}

export interface NetworkStats {
  total_validators: number
  active_validators: number
  emails_validated_today: number
  total_reputation_points: number
  average_reputation_score: number
  total_staked: number
  total_burned: number
}

export interface TokenStats {
  price: number
  price_change_24h: number
  market_cap: number
  total_supply: number
  circulating_supply: number
  burned_today: number
  staking_apy: number
}

// Real Database Operations
export class DatabaseService {
  // Users
  static async createUser(userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        reputation_score: userData.reputation_score || 0,
        trust_tokens: userData.trust_tokens || 0,
        tier: userData.tier || 'Bronze',
        is_validator: userData.is_validator || false,
        total_campaigns: userData.total_campaigns || 0,
        successful_campaigns: userData.successful_campaigns || 0,
        validation_accuracy: userData.validation_accuracy || 0
      })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create user: ${error.message}`)
    return data
  }

  static async getUserByWallet(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user: ${error.message}`)
    }
    return data
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update user: ${error.message}`)
    return data
  }

  static async updateUserTokens(userId: string, tokenAmount: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ 
        trust_tokens: tokenAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (error) throw new Error(`Failed to update tokens: ${error.message}`)
  }

  static async updateUserReputation(userId: string, reputationScore: number): Promise<void> {
    // Calculate tier based on reputation
    let tier: User['tier'] = 'Bronze'
    if (reputationScore >= 9000) tier = 'Legendary'
    else if (reputationScore >= 7000) tier = 'Diamond'
    else if (reputationScore >= 5000) tier = 'Gold'
    else if (reputationScore >= 3000) tier = 'Silver'

    const { error } = await supabase
      .from('users')
      .update({ 
        reputation_score: reputationScore,
        tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (error) throw new Error(`Failed to update reputation: ${error.message}`)
  }

  // Campaigns
  static async createCampaign(campaignData: Partial<EmailCampaign>): Promise<EmailCampaign> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .insert({
        ...campaignData,
        emails_sent: campaignData.emails_sent || 0,
        open_rate: campaignData.open_rate || 0,
        click_rate: campaignData.click_rate || 0,
        spam_reports: campaignData.spam_reports || 0,
        reputation_impact: campaignData.reputation_impact || 0,
        status: campaignData.status || 'draft'
      })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create campaign: ${error.message}`)
    return data
  }

  static async getCampaigns(limit = 50, userId?: string): Promise<EmailCampaign[]> {
    let query = supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('sender_id', userId)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(`Failed to get campaigns: ${error.message}`)
    return data || []
  }

  static async getCampaignById(id: string): Promise<EmailCampaign | null> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get campaign: ${error.message}`)
    }
    return data
  }

  static async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update campaign: ${error.message}`)
    return data
  }

  // Validations
  static async createValidation(validationData: Partial<EmailValidation>): Promise<EmailValidation> {
    const { data, error } = await supabase
      .from('email_validations')
      .insert({
        ...validationData,
        confidence_score: validationData.confidence_score || 0,
        human_verified: validationData.human_verified || false,
        reward_earned: validationData.reward_earned || 0,
        validator_votes: validationData.validator_votes || { legitimate: 0, spam: 0, total: 0 },
        consensus_reached: validationData.consensus_reached || false,
        status: validationData.status || 'pending'
      })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create validation: ${error.message}`)
    return data
  }

  static async getValidationsByCampaign(campaignId: string): Promise<EmailValidation[]> {
    const { data, error } = await supabase
      .from('email_validations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(`Failed to get validations: ${error.message}`)
    return data || []
  }

  static async getValidationsByUser(userId: string): Promise<EmailValidation[]> {
    const { data, error } = await supabase
      .from('email_validations')
      .select('*')
      .eq('validator_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(`Failed to get user validations: ${error.message}`)
    return data || []
  }

  static async getPendingValidations(limit = 20): Promise<EmailValidation[]> {
    const { data, error } = await supabase
      .from('email_validations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (error) throw new Error(`Failed to get pending validations: ${error.message}`)
    return data || []
  }

  static async updateValidation(id: string, updates: Partial<EmailValidation>): Promise<EmailValidation> {
    const { data, error } = await supabase
      .from('email_validations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to update validation: ${error.message}`)
    return data
  }

  // Transactions  
  static async createTransaction(txData: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...txData,
        status: txData.status || 'pending',
        gas_used: txData.gas_used || 0
      })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create transaction: ${error.message}`)
    return data
  }

  static async getTransactionsByUser(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw new Error(`Failed to get transactions: ${error.message}`)
    return data || []
  }

  static async updateTransactionStatus(id: string, status: Transaction['status'], txHash?: string): Promise<void> {
    const updates: any = { status }
    if (txHash) updates.blockchain_tx_hash = txHash

    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
    
    if (error) throw new Error(`Failed to update transaction: ${error.message}`)
  }

  // Analytics and Stats
  static async getNetworkStats(): Promise<NetworkStats> {
    try {
      // Get total validators
      const { data: validators, error: validatorsError } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('is_validator', true)

      if (validatorsError) throw validatorsError

      // Get active validators (validated in last 24h)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: activeValidators, error: activeError } = await supabase
        .from('email_validations')
        .select('validator_id', { count: 'exact' })
        .gte('created_at', yesterday)

      if (activeError) throw activeError

      // Get emails validated today
      const today = new Date().toISOString().split('T')[0]
      const { data: todayValidations, error: todayError } = await supabase
        .from('email_validations')
        .select('id', { count: 'exact' })
        .gte('created_at', today)

      if (todayError) throw todayError

      // Get reputation stats
      const { data: reputationData, error: repError } = await supabase
        .from('users')
        .select('reputation_score, trust_tokens')

      if (repError) throw repError

      const totalReputation = reputationData?.reduce((sum, user) => sum + user.reputation_score, 0) || 0
      const averageReputation = reputationData?.length ? totalReputation / reputationData.length : 0
      const totalStaked = reputationData?.reduce((sum, user) => sum + user.trust_tokens, 0) || 0

      return {
        total_validators: validators?.length || 0,
        active_validators: new Set(activeValidators?.map(v => v.validator_id)).size || 0,
        emails_validated_today: todayValidations?.length || 0,
        total_reputation_points: totalReputation,
        average_reputation_score: Math.round(averageReputation),
        total_staked: totalStaked,
        total_burned: 0 // Would need separate tracking
      }
    } catch (error) {
      console.error('Failed to get network stats:', error)
      return {
        total_validators: 0,
        active_validators: 0,
        emails_validated_today: 0,
        total_reputation_points: 0,
        average_reputation_score: 0,
        total_staked: 0,
        total_burned: 0
      }
    }
  }

  static async getTokenStats(): Promise<TokenStats> {
    // This would typically come from a price API like CoinGecko
    // For now, return calculated values from database
    try {
      const { data: users } = await supabase
        .from('users')
        .select('trust_tokens')

      const totalSupply = 1000000000 // 1B tokens
      const circulatingSupply = users?.reduce((sum, user) => sum + user.trust_tokens, 0) || 0
      
      return {
        price: 2.47, // Would come from price API
        price_change_24h: 5.2, // Would come from price API
        market_cap: 2470000000, // price * circulating supply
        total_supply: totalSupply,
        circulating_supply: circulatingSupply,
        burned_today: 0, // Would need burn tracking
        staking_apy: 18.5 // Would be calculated from staking rewards
      }
    } catch (error) {
      console.error('Failed to get token stats:', error)
      return {
        price: 0,
        price_change_24h: 0,
        market_cap: 0,
        total_supply: 1000000000,
        circulating_supply: 0,
        burned_today: 0,
        staking_apy: 18.5
      }
    }
  }

  static async getCampaignStats(): Promise<any> {
    try {
      // Use simpler queries to avoid RLS policy recursion
      const [campaignsResult, validationsResult, usersResult] = await Promise.all([
        supabase.from('email_campaigns').select('id', { count: 'exact', head: true }),
        supabase.from('email_validations').select('id', { count: 'exact', head: true }),
        supabase.rpc('get_user_count') // Use RPC function to bypass RLS
      ])

      return {
        totalCampaigns: campaignsResult.count || 0,
        totalValidations: validationsResult.count || 0,
        totalUsers: usersResult.data || 0
      }
    } catch (error) {
      console.error('Error fetching network stats:', error)
      // Return default values if there's an error
      return {
        totalCampaigns: 0,
        totalValidations: 0,
        totalUsers: 0
      }
    }
  }

  // Real-time subscriptions
  static subscribeToValidations(callback: (validation: EmailValidation) => void) {
    return supabase
      .channel('validations')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'email_validations' },
        (payload) => callback(payload.new as EmailValidation)
      )
      .subscribe()
  }

  static subscribeToCampaigns(callback: (campaign: EmailCampaign) => void) {
    return supabase
      .channel('campaigns')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_campaigns' },
        (payload) => callback(payload.new as EmailCampaign)
      )
      .subscribe()
  }
}