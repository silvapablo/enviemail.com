import { useState, useCallback } from 'react'
import { integrationService } from '../services/integrationService'
import { EmailAnalysisResult } from '../services/openaiService'

interface UseIntegrationReturn {
  createCampaign: (campaignData: any) => Promise<{ campaignId: string; txHash: string; aiAnalysis?: EmailAnalysisResult }>
  submitValidation: (validationData: any) => Promise<{ validationId: string; txHash: string; aiAnalysis?: EmailAnalysisResult }>
  getCampaignFullData: (campaignId: string) => Promise<any>
  healthCheck: () => Promise<any>
  isLoading: boolean
  error: string | null
}

export const useIntegration = (): UseIntegrationReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCampaign = useCallback(async (campaignData: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await integrationService.createIntegratedCampaign(campaignData)
      console.log('✅ Campaign created successfully:', result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Campaign creation failed'
      setError(errorMessage)
      console.error('❌ Campaign creation failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const submitValidation = useCallback(async (validationData: any) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await integrationService.submitIntegratedValidation(validationData)
      console.log('✅ Validation submitted successfully:', result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation submission failed'
      setError(errorMessage)
      console.error('❌ Validation submission failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getCampaignFullData = useCallback(async (campaignId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await integrationService.getCampaignFullData(campaignId)
      console.log('✅ Campaign data retrieved:', result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get campaign data'
      setError(errorMessage)
      console.error('❌ Failed to get campaign data:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const healthCheck = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await integrationService.healthCheck()
      console.log('✅ Health check completed:', result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed'
      setError(errorMessage)
      console.error('❌ Health check failed:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    createCampaign,
    submitValidation,
    getCampaignFullData,
    healthCheck,
    isLoading,
    error
  }
}