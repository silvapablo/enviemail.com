interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface EmailAnalysisResult {
  classification: 'LEGITIMATE' | 'SPAM' | 'SUSPICIOUS';
  confidence: number; // 0-100
  riskScore: number; // 0-100
  reasons: string[];
  detectedPatterns: string[];
  recommendedAction: 'APPROVE' | 'REJECT' | 'HUMAN_REVIEW';
  aiModel: string;
  analysisTime: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

interface EmailMetadata {
  from: string;
  subject: string;
  domain: string;
  timestamp: number;
  targetAudience?: number;
}

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxTokensPerDay: number;
}

class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';
  private analysisCache = new Map<string, { result: EmailAnalysisResult; timestamp: number }>();
  private requestHistory: number[] = [];
  private tokenUsageToday = 0;
  private lastResetDate = new Date().toDateString();
  
  private rateLimits: RateLimitConfig = {
    maxRequestsPerMinute: 20,
    maxRequestsPerHour: 100,
    maxTokensPerDay: 50000
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.error('OpenAI API key not found in environment variables');
    }
  }

  async analyzeEmailContent(emailContent: string, metadata?: EmailMetadata): Promise<EmailAnalysisResult> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(emailContent, metadata);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log('📋 Using cached AI analysis');
      return cached;
    }

    // Check rate limits
    if (!this.checkRateLimits()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      console.log('🤖 Starting AI analysis with GPT-4...');
      const analysis = await this.performAIAnalysis(emailContent, metadata);
      
      // Update usage tracking
      this.updateUsageTracking(analysis.tokenUsage);
      
      // Cache result
      this.cacheResult(cacheKey, analysis);
      
      analysis.analysisTime = Date.now() - startTime;
      console.log(`✅ AI analysis completed in ${analysis.analysisTime}ms`);
      
      return analysis;
    } catch (error) {
      console.error('❌ AI Analysis failed:', error);
      return this.getFallbackAnalysis(emailContent, metadata);
    }
  }

  private async performAIAnalysis(emailContent: string, metadata?: EmailMetadata): Promise<EmailAnalysisResult> {
    const systemPrompt = `You are an expert email security analyst for EmailChain Protocol, a blockchain-based email reputation system. Your role is to analyze emails and classify them with high accuracy.

ANALYSIS FRAMEWORK:

1. SPAM INDICATORS (High Risk):
   - Excessive promotional language ("LIMITED TIME", "ACT NOW", "FREE MONEY")
   - Urgent/threatening language about account suspension
   - Too-good-to-be-true offers (unrealistic returns, prizes)
   - Poor grammar, spelling errors, inconsistent formatting
   - Suspicious links (shortened URLs, typosquatting domains)
   - Requests for personal/financial information
   - Generic greetings instead of personalized content
   - Multiple exclamation marks, ALL CAPS text

2. PHISHING INDICATORS (Critical Risk):
   - Impersonation of legitimate companies/banks
   - Urgent account verification/security alerts
   - Suspicious URLs mimicking real domains
   - Requests for passwords, PINs, or credentials
   - Fake security warnings or virus alerts
   - Mismatched sender domains vs. claimed identity
   - Pressure tactics with time limits

3. LEGITIMATE INDICATORS (Low Risk):
   - Professional formatting and branding
   - Consistent sender identity and domain
   - Relevant content matching recipient context
   - Proper unsubscribe mechanisms
   - Clear contact information
   - Reasonable call-to-action
   - Good grammar and professional tone

4. BLOCKCHAIN/CRYPTO SPECIFIC:
   - Fake wallet notifications
   - Phishing for private keys/seed phrases
   - Fake exchange alerts
   - Pump and dump schemes
   - Fake DeFi opportunities

RESPONSE FORMAT (JSON only, no additional text):
{
  "classification": "LEGITIMATE" | "SPAM" | "SUSPICIOUS",
  "confidence": 0-100,
  "riskScore": 0-100,
  "reasons": ["specific detailed reason 1", "specific detailed reason 2"],
  "detectedPatterns": ["pattern1", "pattern2"],
  "recommendedAction": "APPROVE" | "REJECT" | "HUMAN_REVIEW"
}

CONFIDENCE LEVELS:
- 90-100: Extremely confident (auto-action recommended)
- 70-89: High confidence (likely correct)
- 50-69: Moderate confidence (human review suggested)
- 0-49: Low confidence (definitely needs human review)`;

    const userPrompt = this.buildUserPrompt(emailContent, metadata);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data: OpenAIResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    try {
      const analysis = JSON.parse(content);
      
      // Add metadata
      analysis.aiModel = 'gpt-4';
      analysis.tokenUsage = {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens
      };

      // Validate and sanitize response
      return this.validateAndSanitizeAnalysis(analysis);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON response from AI');
    }
  }

  private buildUserPrompt(emailContent: string, metadata?: EmailMetadata): string {
    let prompt = `Analyze this email for spam/phishing detection:

EMAIL CONTENT:
"${emailContent}"`;

    if (metadata) {
      prompt += `

EMAIL METADATA:
- From: ${metadata.from}
- Subject: ${metadata.subject}
- Domain: ${metadata.domain}
- Timestamp: ${new Date(metadata.timestamp).toISOString()}`;
      
      if (metadata.targetAudience) {
        prompt += `
- Target Audience Size: ${metadata.targetAudience.toLocaleString()}`;
      }
    }

    prompt += `

Provide detailed analysis in the specified JSON format. Focus on specific indicators and be precise in your reasoning.`;

    return prompt;
  }

  private validateAndSanitizeAnalysis(analysis: any): EmailAnalysisResult {
    // Ensure all required fields exist with proper types
    const sanitized: EmailAnalysisResult = {
      classification: ['LEGITIMATE', 'SPAM', 'SUSPICIOUS'].includes(analysis.classification) 
        ? analysis.classification : 'SUSPICIOUS',
      confidence: Math.max(0, Math.min(100, Number(analysis.confidence) || 50)),
      riskScore: Math.max(0, Math.min(100, Number(analysis.riskScore) || 50)),
      reasons: Array.isArray(analysis.reasons) ? analysis.reasons.slice(0, 10) : ['Analysis completed'],
      detectedPatterns: Array.isArray(analysis.detectedPatterns) ? analysis.detectedPatterns.slice(0, 10) : [],
      recommendedAction: ['APPROVE', 'REJECT', 'HUMAN_REVIEW'].includes(analysis.recommendedAction)
        ? analysis.recommendedAction : 'HUMAN_REVIEW',
      aiModel: analysis.aiModel || 'gpt-4',
      analysisTime: 0,
      tokenUsage: analysis.tokenUsage
    };

    // Ensure consistency between classification and recommended action
    if (sanitized.classification === 'LEGITIMATE' && sanitized.confidence > 80) {
      sanitized.recommendedAction = 'APPROVE';
    } else if (sanitized.classification === 'SPAM' && sanitized.confidence > 80) {
      sanitized.recommendedAction = 'REJECT';
    } else if (sanitized.confidence < 70) {
      sanitized.recommendedAction = 'HUMAN_REVIEW';
    }

    return sanitized;
  }

  private getFallbackAnalysis(emailContent: string, metadata?: EmailMetadata): EmailAnalysisResult {
    console.log('🔄 Using fallback analysis (AI unavailable)');
    
    // Enhanced keyword-based analysis
    const spamKeywords = [
      'urgent', 'limited time', 'act now', 'free money', 'click here', 'winner',
      'congratulations', 'selected', 'claim now', 'verify account', 'suspended',
      'immediate action', 'expires today', 'last chance', 'guaranteed'
    ];
    
    const phishingKeywords = [
      'verify your account', 'confirm identity', 'update payment', 'security alert',
      'suspicious activity', 'click to verify', 'account locked', 'immediate verification'
    ];

    const content = emailContent.toLowerCase();
    const foundSpamKeywords = spamKeywords.filter(keyword => content.includes(keyword));
    const foundPhishingKeywords = phishingKeywords.filter(keyword => content.includes(keyword));
    
    const spamScore = foundSpamKeywords.length * 15;
    const phishingScore = foundPhishingKeywords.length * 25;
    const totalRiskScore = Math.min(100, spamScore + phishingScore);
    
    let classification: 'LEGITIMATE' | 'SPAM' | 'SUSPICIOUS' = 'LEGITIMATE';
    let recommendedAction: 'APPROVE' | 'REJECT' | 'HUMAN_REVIEW' = 'APPROVE';
    
    if (foundPhishingKeywords.length > 0 || totalRiskScore > 60) {
      classification = 'SPAM';
      recommendedAction = 'REJECT';
    } else if (foundSpamKeywords.length > 1 || totalRiskScore > 30) {
      classification = 'SUSPICIOUS';
      recommendedAction = 'HUMAN_REVIEW';
    }

    return {
      classification,
      confidence: Math.max(40, 100 - totalRiskScore),
      riskScore: totalRiskScore,
      reasons: [
        ...foundSpamKeywords.map(k => `Contains spam keyword: "${k}"`),
        ...foundPhishingKeywords.map(k => `Contains phishing keyword: "${k}"`),
        ...(foundSpamKeywords.length === 0 && foundPhishingKeywords.length === 0 ? ['No obvious spam indicators detected'] : [])
      ],
      detectedPatterns: [...foundSpamKeywords, ...foundPhishingKeywords],
      recommendedAction,
      aiModel: 'fallback-keywords',
      analysisTime: 0
    };
  }

  private checkRateLimits(): boolean {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    const oneHour = 60 * oneMinute;
    
    // Reset daily token usage if new day
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.tokenUsageToday = 0;
      this.lastResetDate = today;
    }
    
    // Clean old requests
    this.requestHistory = this.requestHistory.filter(time => now - time < oneHour);
    
    // Check limits
    const requestsLastMinute = this.requestHistory.filter(time => now - time < oneMinute).length;
    const requestsLastHour = this.requestHistory.length;
    
    if (requestsLastMinute >= this.rateLimits.maxRequestsPerMinute) {
      console.warn('⚠️ Rate limit: Too many requests per minute');
      return false;
    }
    
    if (requestsLastHour >= this.rateLimits.maxRequestsPerHour) {
      console.warn('⚠️ Rate limit: Too many requests per hour');
      return false;
    }
    
    if (this.tokenUsageToday >= this.rateLimits.maxTokensPerDay) {
      console.warn('⚠️ Rate limit: Daily token limit reached');
      return false;
    }
    
    // Record this request
    this.requestHistory.push(now);
    return true;
  }

  private updateUsageTracking(tokenUsage?: { total: number }): void {
    if (tokenUsage) {
      this.tokenUsageToday += tokenUsage.total;
    }
  }

  private generateCacheKey(emailContent: string, metadata?: EmailMetadata): string {
    const content = emailContent + (metadata ? JSON.stringify(metadata) : '');
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  private getCachedResult(cacheKey: string): EmailAnalysisResult | null {
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      const cacheAge = Date.now() - cached.timestamp;
      const cacheMaxAge = 60 * 60 * 1000; // 1 hour
      
      if (cacheAge < cacheMaxAge) {
        return cached.result;
      } else {
        this.analysisCache.delete(cacheKey);
      }
    }
    return null;
  }

  private cacheResult(cacheKey: string, result: EmailAnalysisResult): void {
    this.analysisCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.analysisCache.size > 1000) {
      const oldestKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(oldestKey);
    }
  }

  // Public methods for monitoring
  getUsageStats() {
    return {
      tokenUsageToday: this.tokenUsageToday,
      requestsLastHour: this.requestHistory.length,
      cacheSize: this.analysisCache.size,
      rateLimits: this.rateLimits
    };
  }

  clearCache(): void {
    this.analysisCache.clear();
    console.log('🗑️ AI analysis cache cleared');
  }
}

export default OpenAIService;
export type { EmailAnalysisResult, EmailMetadata };