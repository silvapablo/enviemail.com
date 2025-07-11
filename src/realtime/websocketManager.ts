import CryptoJS from 'crypto-js'

interface WebSocketMessage {
  type: 'reputation_update' | 'transaction_confirmed' | 'validation_complete' | 'fraud_alert' | 'ping' | 'pong'
  payload: any
  timestamp: number
  signature: string
  messageId: string
}

interface ConnectionConfig {
  url: string
  authToken: string
  encryptionKey: string
  maxReconnectAttempts: number
  heartbeatInterval: number
}

export class RealTimeManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private messageQueue: WebSocketMessage[] = []
  private messageHandlers: Map<string, (payload: any) => void> = new Map()
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private lastPingTime = 0
  private latency = 0
  
  constructor(private config: ConnectionConfig) {
    this.setupMessageHandlers()
  }
  
  private setupMessageHandlers(): void {
    this.messageHandlers.set('reputation_update', this.handleReputationUpdate.bind(this))
    this.messageHandlers.set('transaction_confirmed', this.handleTransactionConfirmed.bind(this))
    this.messageHandlers.set('validation_complete', this.handleValidationComplete.bind(this))
    this.messageHandlers.set('fraud_alert', this.handleFraudAlert.bind(this))
    this.messageHandlers.set('pong', this.handlePong.bind(this))
  }
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'connected') {
        resolve()
        return
      }
      
      this.connectionState = 'connecting'
      
      try {
        const wsUrl = `${this.config.url}?token=${encodeURIComponent(this.config.authToken)}&timestamp=${Date.now()}`
        this.ws = new WebSocket(wsUrl)
        
        this.ws.onopen = () => {
          console.log('WebSocket connected successfully')
          this.connectionState = 'connected'
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.notifyConnectionChange('connected')
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }
        
        this.ws.onclose = (event) => {
          console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`)
          this.connectionState = 'disconnected'
          this.stopHeartbeat()
          this.notifyConnectionChange('disconnected')
          this.scheduleReconnect()
        }
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.connectionState = 'error'
          this.notifyConnectionChange('error')
          reject(error)
        }
        
        // Connection timeout
        setTimeout(() => {
          if (this.connectionState === 'connecting') {
            this.ws?.close()
            reject(new Error('Connection timeout'))
          }
        }, 10000) // 10 seconds
        
      } catch (error) {
        this.connectionState = 'error'
        reject(error)
      }
    })
  }
  
  private handleMessage(data: string): void {
    try {
      // Decrypt message
      const decrypted = this.decryptMessage(data)
      const message: WebSocketMessage = JSON.parse(decrypted)
      
      // Validate message structure
      if (!this.validateMessage(message)) {
        console.error('Invalid message structure received')
        return
      }
      
      // Validate message signature
      if (!this.validateMessageSignature(message)) {
        console.error('Invalid message signature')
        return
      }
      
      // Check message age (prevent replay attacks)
      if (Date.now() - message.timestamp > 60000) { // 1 minute
        console.error('Message too old, possible replay attack')
        return
      }
      
      // Process message
      this.processMessage(message)
      
    } catch (error) {
      console.error('Failed to process message:', error)
    }
  }
  
  private validateMessage(message: any): message is WebSocketMessage {
    return (
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      typeof message.timestamp === 'number' &&
      typeof message.signature === 'string' &&
      typeof message.messageId === 'string' &&
      message.payload !== undefined
    )
  }
  
  private validateMessageSignature(message: WebSocketMessage): boolean {
    const dataToSign = `${message.type}:${message.timestamp}:${JSON.stringify(message.payload)}:${message.messageId}`
    const expectedSignature = CryptoJS.HmacSHA256(dataToSign, this.config.encryptionKey).toString()
    return message.signature === expectedSignature
  }
  
  private processMessage(message: WebSocketMessage): void {
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      handler(message.payload)
    } else {
      console.warn(`No handler for message type: ${message.type}`)
    }
  }
  
  private handleReputationUpdate(payload: any): void {
    window.dispatchEvent(new CustomEvent('reputationUpdated', { 
      detail: { 
        userId: payload.userId,
        newScore: payload.score,
        change: payload.change,
        reason: payload.reason,
        timestamp: Date.now()
      } 
    }))
  }
  
  private handleTransactionConfirmed(payload: any): void {
    window.dispatchEvent(new CustomEvent('transactionConfirmed', { 
      detail: {
        transactionId: payload.transactionId,
        hash: payload.hash,
        status: payload.status,
        blockNumber: payload.blockNumber,
        timestamp: Date.now()
      }
    }))
  }
  
  private handleValidationComplete(payload: any): void {
    window.dispatchEvent(new CustomEvent('validationComplete', {
      detail: {
        validationId: payload.validationId,
        result: payload.result,
        consensus: payload.consensus,
        rewards: payload.rewards,
        timestamp: Date.now()
      }
    }))
  }
  
  private handleFraudAlert(payload: any): void {
    window.dispatchEvent(new CustomEvent('fraudAlert', {
      detail: {
        alertId: payload.alertId,
        severity: payload.severity,
        description: payload.description,
        affectedUser: payload.affectedUser,
        timestamp: Date.now()
      }
    }))
  }
  
  private handlePong(payload: any): void {
    this.latency = Date.now() - this.lastPingTime
    console.log(`WebSocket latency: ${this.latency}ms`)
  }
  
  sendMessage(type: string, payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId()
      const timestamp = Date.now()
      
      const message: WebSocketMessage = {
        type: type as any,
        payload,
        timestamp,
        messageId,
        signature: this.signMessage(type, payload, timestamp, messageId)
      }
      
      const encrypted = this.encryptMessage(JSON.stringify(message))
      
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(encrypted)
          resolve()
        } catch (error) {
          reject(error)
        }
      } else {
        // Queue message for when connection is restored
        this.messageQueue.push(message)
        resolve()
      }
    })
  }
  
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private signMessage(type: string, payload: any, timestamp: number, messageId: string): string {
    const dataToSign = `${type}:${timestamp}:${JSON.stringify(payload)}:${messageId}`
    return CryptoJS.HmacSHA256(dataToSign, this.config.encryptionKey).toString()
  }
  
  private encryptMessage(message: string): string {
    return CryptoJS.AES.encrypt(message, this.config.encryptionKey).toString()
  }
  
  private decryptMessage(encryptedMessage: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, this.config.encryptionKey)
    return bytes.toString(CryptoJS.enc.Utf8)
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now()
        this.sendMessage('ping', { timestamp: this.lastPingTime })
      }
    }, this.config.heartbeatInterval)
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
  
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!
      const encrypted = this.encryptMessage(JSON.stringify(message))
      this.ws.send(encrypted)
    }
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) // Exponential backoff, max 30s
    this.reconnectAttempts++
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }, delay)
  }
  
  private notifyConnectionChange(state: string): void {
    window.dispatchEvent(new CustomEvent('websocketStateChange', {
      detail: { state, timestamp: Date.now() }
    }))
  }
  
  disconnect(): void {
    this.stopHeartbeat()
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    
    this.connectionState = 'disconnected'
    this.messageQueue = []
  }
  
  getConnectionState(): string {
    return this.connectionState
  }
  
  getLatency(): number {
    return this.latency
  }
  
  getQueuedMessageCount(): number {
    return this.messageQueue.length
  }
}