import { useState, useCallback, useRef } from 'react';
import OpenAIService, { EmailAnalysisResult, EmailMetadata } from '../services/openaiService';

interface UseEmailAIReturn {
  analyzeEmail: (content: string, metadata?: EmailMetadata) => Promise<EmailAnalysisResult>;
  isAnalyzing: boolean;
  lastAnalysis: EmailAnalysisResult | null;
  error: string | null;
  analysisHistory: EmailAnalysisResult[];
  usageStats: any;
  clearHistory: () => void;
  retryLastAnalysis: () => Promise<void>;
}

export const useEmailAI = (): UseEmailAIReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<EmailAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<EmailAnalysisResult[]>([]);
  const [usageStats, setUsageStats] = useState<any>({});
  
  const aiServiceRef = useRef<OpenAIService | null>(null);
  const lastRequestRef = useRef<{ content: string; metadata?: EmailMetadata } | null>(null);

  // Initialize service lazily
  const getAIService = useCallback(() => {
    if (!aiServiceRef.current) {
      aiServiceRef.current = new OpenAIService();
    }
    return aiServiceRef.current;
  }, []);

  const analyzeEmail = useCallback(async (content: string, metadata?: EmailMetadata): Promise<EmailAnalysisResult> => {
    if (!content.trim()) {
      throw new Error('Email content cannot be empty');
    }

    setIsAnalyzing(true);
    setError(null);
    lastRequestRef.current = { content, metadata };

    try {
      const aiService = getAIService();
      const result = await aiService.analyzeEmailContent(content, metadata);
      
      setLastAnalysis(result);
      setAnalysisHistory(prev => [result, ...prev.slice(0, 19)]); // Keep last 20
      setUsageStats(aiService.getUsageStats());
      
      // Log analysis for monitoring
      console.log('📊 AI Analysis Result:', {
        classification: result.classification,
        confidence: result.confidence,
        riskScore: result.riskScore,
        model: result.aiModel,
        analysisTime: result.analysisTime
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      
      console.error('❌ Email AI Analysis Error:', {
        error: errorMessage,
        contentLength: content.length,
        hasMetadata: !!metadata
      });
      
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [getAIService]);

  const retryLastAnalysis = useCallback(async (): Promise<void> => {
    if (!lastRequestRef.current) {
      throw new Error('No previous analysis to retry');
    }
    
    const { content, metadata } = lastRequestRef.current;
    await analyzeEmail(content, metadata);
  }, [analyzeEmail]);

  const clearHistory = useCallback(() => {
    setAnalysisHistory([]);
    setLastAnalysis(null);
    setError(null);
    
    // Also clear the AI service cache
    const aiService = getAIService();
    aiService.clearCache();
    
    console.log('🗑️ Analysis history cleared');
  }, [getAIService]);

  return {
    analyzeEmail,
    isAnalyzing,
    lastAnalysis,
    error,
    analysisHistory,
    usageStats,
    clearHistory,
    retryLastAnalysis
  };
};