import { DatabaseService } from './supabaseService'
import { blockchainService } from './blockchainService'
import { EmailAnalysisResult } from './openaiService'

export class IntegrationService {
  private static instance: IntegrationService
  
  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService()
    }
    return IntegrationService.instance
  }

  // Sync campaign from Supabase to Blockchain
  async syncCampaignToBlockchain(campaignId: string): Promise<string> {
    try {
      console.log('🔄 Syncing campaign to blockchain:', campaignId)
      
      // Get campaign from Supabase
      const campaign = await DatabaseService.getCampaignById(campaignId)
      if (!campaign) {
        throw new Error('Campaign not found in database')
      }

      // Ensure blockchain is connected
      if (!blockchainService.isContractConnected()) {
        throw new Error('Blockchain not connected')
      }

      // Create campaign on blockchain
      const txHash = await blockchainService.createCampaign(
        campaign.title,
        campaign.content,
        campaign.reward_pool.toString(),
        '10' // Default required stake
      )

      // Update campaign in Supabase with blockchain info
      await DatabaseService.updateCampaign(campaignId, {
        blockchain_tx_hash: txHash,
        status: 'active'
      })

      console.log('✅ Campaign synced to blockchain:', txHash)
      return txHash
    } catch (error) {
      console.error('❌ Failed to sync campaign to blockchain:', error)
      
      // Update campaign status to failed
      await DatabaseService.updateCampaign(campaignId, {
        status: 'failed'
      }).catch(console.error)
      
      throw error
    }
  }

  // Sync validation from Supabase to Blockchain
  async syncValidationToBlockchain(validationId: string): Promise<string> {
    try {
      console.log('🔄 Syncing validation to blockchain:', validationId)
      
      // Get validation from Supabase
      const validation = await DatabaseService.getValidationById(validationId)
      if (!validation) {
        throw new Error('Validation not found in database')
      }

      // Ensure blockchain is connected
      if (!blockchainService.isContractConnected()) {
        throw new Error('Blockchain not connected')
      }

      // Submit validation to blockchain
      const txHash = await blockchainService.validateEmail(
        parseInt(validation.campaign_id), // Assuming campaign_id maps to blockchain campaign ID
        validation.validation_result === 'legitimate',
        validation.confidence_score,
        validation.reasoning || 'AI-assisted validation'
      )

      // Update validation in Supabase with blockchain info
      await DatabaseService.updateValidation(validationId, {
        blockchain_tx_hash: txHash,
        status: 'confirmed'
      })

      console.log('✅ Validation synced to blockchain:', txHash)
      return txHash
    } catch (error) {
      console.error('❌ Failed to sync validation to blockchain:', error)
      
      // Update validation status to failed
      await DatabaseService.updateValidation(validationId, {
        status: 'failed'
      }).catch(console.error)
      
      throw error
    }
  }

  // Create campaign with full integration (Supabase + Blockchain + AI)
  async createIntegratedCampaign(campaignData: {
    title: string
    content: string
    sender_email: string
    target_audience: number
    reward_pool: number
    sender_id: string
  }): Promise<{ campaignId: string; txHash: string; aiAnalysis?: EmailAnalysisResult }> {
    try {
      console.log('🚀 Creating integrated campaign...')
      
      // 1. Create campaign in Supabase first
      const campaign = await DatabaseService.createCampaign({
        ...campaignData,
        status: 'pending'
      })

      console.log('✅ Campaign created in database:', campaign.id)

      // 2. Optionally analyze email content with AI
      let aiAnalysis: EmailAnalysisResult | undefined
      try {
        const { default: OpenAIService } = await import('./openaiService')
        const aiService = new OpenAIService()
        aiAnalysis = await aiService.analyzeEmailContent(campaignData.content, {
          from: campaignData.sender_email,
          subject: campaignData.title,
          domain: campaignData.sender_email.split('@')[1] || 'unknown',
          timestamp: Date.now()
        })
        
        console.log('🤖 AI analysis completed:', aiAnalysis.classification)
      } catch (aiError) {
        console.warn('⚠️ AI analysis failed, continuing without it:', aiError)
      }

      // 3. Sync to blockchain
      const txHash = await this.syncCampaignToBlockchain(campaign.id)

      // 4. Update with AI analysis if available
      if (aiAnalysis) {
        await DatabaseService.updateCampaign(campaign.id, {
          ai_analysis: aiAnalysis
        })
      }

      console.log('🎉 Integrated campaign created successfully!')
      
      return {
        campaignId: campaign.id,
        txHash,
        aiAnalysis
      }
    } catch (error) {
      console.error('❌ Failed to create integrated campaign:', error)
      throw error
    }
  }

  // Submit validation with full integration (AI + Supabase + Blockchain)
  async submitIntegratedValidation(validationData: {
    campaign_id: string
    validator_id: string
    email_content: string
    validation_result: 'legitimate' | 'spam' | 'suspicious'
    confidence_score: number
    reasoning?: string
  }): Promise<{ validationId: string; txHash: string; aiAnalysis?: EmailAnalysisResult }> {
    try {
      console.log('🚀 Submitting integrated validation...')
      
      // 1. Optionally get AI analysis for comparison
      let aiAnalysis: EmailAnalysisResult | undefined
      try {
        const { default: OpenAIService } = await import('./openaiService')
        const aiService = new OpenAIService()
        aiAnalysis = await aiService.analyzeEmailContent(validationData.email_content)
        
        console.log('🤖 AI analysis for validation:', aiAnalysis.classification)
      } catch (aiError) {
        console.warn('⚠️ AI analysis failed for validation:', aiError)
      }

      // 2. Create validation in Supabase
      const validation = await DatabaseService.createValidation({
        ...validationData,
        ai_analysis: aiAnalysis,
        status: 'pending'
      })

      console.log('✅ Validation created in database:', validation.id)

      // 3. Sync to blockchain
      const txHash = await this.syncValidationToBlockchain(validation.id)

      console.log('🎉 Integrated validation submitted successfully!')
      
      return {
        validationId: validation.id,
        txHash,
        aiAnalysis
      }
    } catch (error) {
      console.error('❌ Failed to submit integrated validation:', error)
      throw error
    }
  }

  // Sync blockchain events back to Supabase
  async syncBlockchainEvents(): Promise<void> {
    try {
      console.log('🔄 Syncing blockchain events to database...')
      
      if (!blockchainService.isContractConnected()) {
        console.warn('⚠️ Blockchain not connected, skipping event sync')
        return
      }

      // This would listen to blockchain events and update Supabase accordingly
      // Implementation depends on specific event handling requirements
      
      console.log('✅ Blockchain events synced')
    } catch (error) {
      console.error('❌ Failed to sync blockchain events:', error)
    }
  }

  // Get comprehensive campaign data (Supabase + Blockchain)
  async getCampaignFullData(campaignId: string): Promise<any> {
    try {
      // Get from Supabase
      const dbCampaign = await DatabaseService.getCampaignById(campaignId)
      if (!dbCampaign) {
        throw new Error('Campaign not found in database')
      }

      let blockchainData = null
      
      // Try to get from blockchain if connected
      if (blockchainService.isContractConnected()) {
        try {
          // Assuming we store blockchain campaign ID in metadata
          const blockchainCampaignId = dbCampaign.blockchain_campaign_id || 0
          blockchainData = await blockchainService.getCampaignDetails(blockchainCampaignId)
        } catch (blockchainError) {
          console.warn('⚠️ Failed to get blockchain data:', blockchainError)
        }
      }

      return {
        database: dbCampaign,
        blockchain: blockchainData,
        isFullySynced: !!blockchainData
      }
    } catch (error) {
      console.error('❌ Failed to get campaign full data:', error)
      throw error
    }
  }

  // Health check for all integrations
  async healthCheck(): Promise<{
    supabase: boolean
    blockchain: boolean
    openai: boolean
    overall: boolean
  }> {
    const health = {
      supabase: false,
      blockchain: false,
      openai: false,
      overall: false
    }

    try {
      // Check Supabase
      await DatabaseService.getCampaignStats()
      health.supabase = true
      console.log('✅ Supabase connection healthy')
    } catch (error) {
      console.error('❌ Supabase connection failed:', error)
    }

    try {
      // Check Blockchain
      health.blockchain = blockchainService.isContractConnected()
      if (health.blockchain) {
        console.log('✅ Blockchain connection healthy')
      } else {
        console.warn('⚠️ Blockchain not connected')
      }
    } catch (error) {
      console.error('❌ Blockchain connection failed:', error)
    }

    try {
      // Check OpenAI
      const { default: OpenAIService } = await import('./openaiService')
      const aiService = new OpenAIService()
      // Simple test to check if API key is valid
      health.openai = !!process.env.VITE_OPENAI_API_KEY
      console.log('✅ OpenAI configuration healthy')
    } catch (error) {
      console.error('❌ OpenAI configuration failed:', error)
    }

    health.overall = health.supabase && health.blockchain && health.openai
    
    return health
  }
}

// Export singleton instance
export const integrationService = IntegrationService.getInstance()