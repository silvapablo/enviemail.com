import { useEffect, useState, useCallback } from 'react'
import { RealTimeManager } from '../realtime/websocketManager'
import { useSecureStore } from '../store/secureStore'

interface UseRealTimeDataOptions {
  autoConnect?: boolean
  reconnectOnError?: boolean
}

export const useRealTimeData = (options: UseRealTimeDataOptions = {}) => {
  const { autoConnect = true, reconnectOnError = true } = options
  const { user, sessionId } = useSecureStore()
  const [realTimeManager, setRealTimeManager] = useState<RealTimeManager | null>(null)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [latency, setLatency] = useState<number>(0)
  
  // Initialize real-time manager
  useEffect(() => {
    if (!user || !sessionId) return
    
    const wsUrl = process.env.REACT_APP_WS_URL || 'wss://localhost:8080'
    const encryptionKey = 'your-encryption-key' // Should come from secure store
    
    const manager = new RealTimeManager({
      url: wsUrl,
      authToken: sessionId,
      encryptionKey,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000
    })
    
    setRealTimeManager(manager)
    
    return () => {
      manager.disconnect()
    }
  }, [user, sessionId])
  
  // Setup event listeners
  useEffect(() => {
    if (!realTimeManager) return
    
    const handleStateChange = (event: CustomEvent) => {
      setConnectionState(event.detail.state)
    }
    
    const handleReputationUpdate = (event: CustomEvent) => {
      // Update user reputation in store
      console.log('Reputation updated:', event.detail)
    }
    
    const handleTransactionConfirmed = (event: CustomEvent) => {
      // Update transaction status in store
      console.log('Transaction confirmed:', event.detail)
    }
    
    const handleValidationComplete = (event: CustomEvent) => {
      // Update validation status
      console.log('Validation complete:', event.detail)
    }
    
    const handleFraudAlert = (event: CustomEvent) => {
      // Show fraud alert to user
      console.log('Fraud alert:', event.detail)
    }
    
    window.addEventListener('websocketStateChange', handleStateChange as EventListener)
    window.addEventListener('reputationUpdated', handleReputationUpdate as EventListener)
    window.addEventListener('transactionConfirmed', handleTransactionConfirmed as EventListener)
    window.addEventListener('validationComplete', handleValidationComplete as EventListener)
    window.addEventListener('fraudAlert', handleFraudAlert as EventListener)
    
    return () => {
      window.removeEventListener('websocketStateChange', handleStateChange as EventListener)
      window.removeEventListener('reputationUpdated', handleReputationUpdate as EventListener)
      window.removeEventListener('transactionConfirmed', handleTransactionConfirmed as EventListener)
      window.removeEventListener('validationComplete', handleValidationComplete as EventListener)
      window.removeEventListener('fraudAlert', handleFraudAlert as EventListener)
    }
  }, [realTimeManager])
  
  // Auto-connect
  useEffect(() => {
    if (autoConnect && realTimeManager && connectionState === 'disconnected') {
      connect()
    }
  }, [autoConnect, realTimeManager, connectionState])
  
  const connect = useCallback(async () => {
    if (!realTimeManager) return
    
    try {
      await realTimeManager.connect()
    } catch (error) {
      console.error('Failed to connect to real-time service:', error)
      if (reconnectOnError) {
        setTimeout(connect, 5000) // Retry after 5 seconds
      }
    }
  }, [realTimeManager, reconnectOnError])
  
  const disconnect = useCallback(() => {
    if (realTimeManager) {
      realTimeManager.disconnect()
    }
  }, [realTimeManager])
  
  const sendMessage = useCallback(async (type: string, payload: any) => {
    if (!realTimeManager) {
      throw new Error('Real-time manager not initialized')
    }
    
    return realTimeManager.sendMessage(type, payload)
  }, [realTimeManager])
  
  // Update latency
  useEffect(() => {
    if (realTimeManager) {
      const interval = setInterval(() => {
        setLatency(realTimeManager.getLatency())
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [realTimeManager])
  
  return {
    connectionState,
    latency,
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionState === 'connected',
    queuedMessages: realTimeManager?.getQueuedMessageCount() || 0
  }
}