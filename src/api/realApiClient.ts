interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface PaginationParams {
  page: number
  limit: number
  sortBy: string
  order: 'asc' | 'desc'
}

interface CampaignData {
  name: string
  targetAudience: number
  subject: string
  content: string
  qualityThreshold: number
  stakeAmount: number
  scheduledAt?: string
}

interface ValidationResult {
  isValid: boolean
  riskScore: number
  flags: string[]
  recommendations: string[]
}

class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

class RateLimiter {
  private requests: number[] = []
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  async checkLimit(): Promise<void> {
    const now = Date.now()
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.windowMs - (now - oldestRequest)
      
      throw new APIError(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`, 429, 'RATE_LIMIT_EXCEEDED')
    }
    
    this.requests.push(now)
  }
}

export class RealAPIClient {
  private baseURL: string
  private apiKey: string
  private rateLimiter: RateLimiter
  private requestTimeout = 30000 // 30 seconds
  
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://api.emailchain.com'
    this.apiKey = process.env.REACT_APP_API_KEY || ''
    this.rateLimiter = new RateLimiter(100, 60000) // 100 requests per minute
    
    if (!this.apiKey) {
      console.warn('API key not configured. Some features may not work.')
    }
  }
  
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    await this.rateLimiter.checkLimit()
    
    const requestId = this.generateRequestId()
    const url = `${this.baseURL}${endpoint}`
    
    const defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Timestamp': Date.now().toString(),
      'X-Client-Version': '1.0.0'
    }
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)
    
    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new APIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        )
      }
      
      const data = await response.json()
      return data
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408, 'TIMEOUT')
      }
      
      if (error instanceof APIError) {
        throw error
      }
      
      throw new APIError(`Network error: ${error.message}`, 0, 'NETWORK_ERROR')
    }
  }
  
  // Authentication
  async authenticate(walletAddress: string, signature: string): Promise<APIResponse<{ token: string; user: any }>> {
    return this.makeRequest('/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature })
    })
  }
  
  async refreshToken(refreshToken: string): Promise<APIResponse<{ token: string }>> {
    return this.makeRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    })
  }
  
  // Campaign Management
  async createCampaign(campaignData: CampaignData): Promise<APIResponse<Campaign>> {
    return this.makeRequest('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData)
    })
  }
  
  async getCampaigns(userId: string, pagination?: Partial<PaginationParams>): Promise<APIResponse<{ campaigns: Campaign[]; total: number }>> {
    const params = new URLSearchParams({
      userId,
      page: (pagination?.page || 1).toString(),
      limit: (pagination?.limit || 20).toString(),
      sortBy: pagination?.sortBy || 'createdAt',
      order: pagination?.order || 'desc'
    })
    
    return this.makeRequest(`/campaigns?${params}`)
  }
  
  async updateCampaign(campaignId: string, updates: Partial<CampaignData>): Promise<APIResponse<Campaign>> {
    return this.makeRequest(`/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }
  
  async deleteCampaign(campaignId: string): Promise<APIResponse<void>> {
    return this.makeRequest(`/campaigns/${campaignId}`, {
      method: 'DELETE'
    })
  }
  
  // Transaction Management
  async getTransactionHistory(
    userId: string, 
    pagination: PaginationParams
  ): Promise<APIResponse<{ transactions: SecureTransaction[]; total: number }>> {
    const params = new URLSearchParams({
      userId,
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      sortBy: pagination.sortBy,
      order: pagination.order
    })
    
    return this.makeRequest(`/transactions?${params}`)
  }
  
  async getTransaction(transactionId: string): Promise<APIResponse<SecureTransaction>> {
    return this.makeRequest(`/transactions/${transactionId}`)
  }
  
  async createTransaction(transactionData: Partial<SecureTransaction>): Promise<APIResponse<SecureTransaction>> {
    return this.makeRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    })
  }
  
  // Email Validation
  async validateEmail(content: string): Promise<APIResponse<ValidationResult>> {
    return this.makeRequest('/validate-email', {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  }
  
  async submitForValidation(emailHash: string, metadata: any): Promise<APIResponse<{ taskId: string }>> {
    return this.makeRequest('/validation-tasks', {
      method: 'POST',
      body: JSON.stringify({ emailHash, metadata })
    })
  }
  
  async getValidationTasks(validatorId: string): Promise<APIResponse<EmailValidation[]>> {
    return this.makeRequest(`/validation-tasks?validatorId=${validatorId}`)
  }
  
  async submitValidation(taskId: string, result: 'legitimate' | 'spam', confidence: number): Promise<APIResponse<void>> {
    return this.makeRequest(`/validation-tasks/${taskId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ result, confidence })
    })
  }
  
  // User Management
  async getUserProfile(userId: string): Promise<APIResponse<User>> {
    return this.makeRequest(`/users/${userId}`)
  }
  
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<APIResponse<User>> {
    return this.makeRequest(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  }
  
  async getUserReputation(userId: string): Promise<APIResponse<{ score: number; history: ReputationHistory[] }>> {
    return this.makeRequest(`/users/${userId}/reputation`)
  }
  
  // Staking
  async getStakingInfo(userId: string): Promise<APIResponse<{ totalStaked: number; rewards: number; positions: any[] }>> {
    return this.makeRequest(`/staking/${userId}`)
  }
  
  async createStakePosition(userId: string, amount: number, duration: number): Promise<APIResponse<{ positionId: string }>> {
    return this.makeRequest('/staking/positions', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, duration })
    })
  }
  
  async unstake(positionId: string): Promise<APIResponse<{ transactionId: string }>> {
    return this.makeRequest(`/staking/positions/${positionId}/unstake`, {
      method: 'POST'
    })
  }
  
  // Analytics
  async getNetworkStats(): Promise<APIResponse<NetworkStats>> {
    return this.makeRequest('/analytics/network')
  }
  
  async getTokenStats(): Promise<APIResponse<TokenStats>> {
    return this.makeRequest('/analytics/tokens')
  }
  
  async getUserAnalytics(userId: string, timeframe: string): Promise<APIResponse<any>> {
    return this.makeRequest(`/analytics/users/${userId}?timeframe=${timeframe}`)
  }
  
  // Notifications
  async getNotifications(userId: string, unreadOnly = false): Promise<APIResponse<SecureNotification[]>> {
    const params = unreadOnly ? '?unreadOnly=true' : ''
    return this.makeRequest(`/notifications/${userId}${params}`)
  }
  
  async markNotificationRead(notificationId: string): Promise<APIResponse<void>> {
    return this.makeRequest(`/notifications/${notificationId}/read`, {
      method: 'POST'
    })
  }
  
  async deleteNotification(notificationId: string): Promise<APIResponse<void>> {
    return this.makeRequest(`/notifications/${notificationId}`, {
      method: 'DELETE'
    })
  }
  
  // Health Check
  async healthCheck(): Promise<APIResponse<{ status: string; timestamp: number }>> {
    return this.makeRequest('/health')
  }
  
  // File Upload
  async uploadFile(file: File, type: 'avatar' | 'template' | 'asset'): Promise<APIResponse<{ url: string; fileId: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return this.makeRequest('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Request-ID': this.generateRequestId(),
        'X-Timestamp': Date.now().toString()
        // Don't set Content-Type for FormData
      }
    })
  }
}

// Export singleton instance
export const apiClient = new RealAPIClient()