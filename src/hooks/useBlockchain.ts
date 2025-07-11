import { useState, useEffect, useCallback } from 'react'
import { web3Manager } from '../blockchain/web3Manager'
import { useSecureStore } from '../store/secureStore'

export const useBlockchain = () => {
  const { setWalletAddress, addTransaction } = useSecureStore()
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string>('')
  const [network, setNetwork] = useState<any>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    // Setup event listeners
    const handleConnected = (address: string) => {
      setIsConnected(true)
      setAddress(address)
      setWalletAddress(address)
      setError(null)
    }
    
    const handleDisconnected = () => {
      setIsConnected(false)
      setAddress('')
      setWalletAddress(null)
      setNetwork(null)
    }
    
    const handleAccountChanged = (newAddress: string) => {
      setAddress(newAddress)
      setWalletAddress(newAddress)
    }
    
    const handleNetworkChanged = (newNetwork: any) => {
      setNetwork(newNetwork)
    }
    
    web3Manager.on('connected', handleConnected)
    web3Manager.on('disconnected', handleDisconnected)
    web3Manager.on('accountChanged', handleAccountChanged)
    web3Manager.on('networkChanged', handleNetworkChanged)
    
    return () => {
      web3Manager.off('connected', handleConnected)
      web3Manager.off('disconnected', handleDisconnected)
      web3Manager.off('accountChanged', handleAccountChanged)
      web3Manager.off('networkChanged', handleNetworkChanged)
    }
  }, [setWalletAddress])
  
  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      const address = await web3Manager.connectWallet()
      const network = web3Manager.getCurrentNetwork()
      setNetwork(network)
      return address
    } catch (error: any) {
      setError(error.message)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [])
  
  const disconnect = useCallback(() => {
    web3Manager.disconnect()
  }, [])
  
  const getTokenBalance = useCallback(async (address?: string) => {
    try {
      return await web3Manager.getTokenBalance(address)
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [])
  
  const stakeTokens = useCallback(async (amount: string) => {
    try {
      const tx = await web3Manager.stakeTokens(amount)
      
      // Add transaction to store
      await addTransaction({
        type: 'stake',
        amount: parseFloat(amount),
        from: address,
        to: 'staking-contract',
        gasUsed: 0,
        status: 'pending',
        hash: tx.hash,
        ipAddress: '127.0.0.1', // Would be real IP
        userAgent: navigator.userAgent,
        blockNumber: 0,
        confirmations: 0,
        securityScore: 0,
        riskFlags: []
      })
      
      return tx
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [address, addTransaction])
  
  const unstakeTokens = useCallback(async (amount: string) => {
    try {
      const tx = await web3Manager.unstakeTokens(amount)
      
      await addTransaction({
        type: 'unstake',
        amount: parseFloat(amount),
        from: address,
        to: 'staking-contract',
        gasUsed: 0,
        status: 'pending',
        hash: tx.hash,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        blockNumber: 0,
        confirmations: 0,
        securityScore: 0,
        riskFlags: []
      })
      
      return tx
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [address, addTransaction])
  
  const createCampaign = useCallback(async (
    targetAudience: number,
    qualityThreshold: number,
    stakeAmount: string
  ) => {
    try {
      const tx = await web3Manager.createCampaign(targetAudience, qualityThreshold, stakeAmount)
      
      await addTransaction({
        type: 'campaign',
        amount: parseFloat(stakeAmount),
        from: address,
        to: 'campaign-contract',
        gasUsed: 0,
        status: 'pending',
        hash: tx.hash,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        blockNumber: 0,
        confirmations: 0,
        securityScore: 0,
        riskFlags: []
      })
      
      return tx
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [address, addTransaction])
  
  const getStakedAmount = useCallback(async (address?: string) => {
    try {
      return await web3Manager.getStakedAmount(address)
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [])
  
  const calculateRewards = useCallback(async (address?: string) => {
    try {
      return await web3Manager.calculateRewards(address)
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [])
  
  const claimRewards = useCallback(async () => {
    try {
      const tx = await web3Manager.claimRewards()
      
      await addTransaction({
        type: 'reward',
        amount: 0, // Amount would be determined by contract
        from: 'staking-contract',
        to: address,
        gasUsed: 0,
        status: 'pending',
        hash: tx.hash,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        blockNumber: 0,
        confirmations: 0,
        securityScore: 0,
        riskFlags: []
      })
      
      return tx
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [address, addTransaction])
  
  const getGasPrice = useCallback(async () => {
    try {
      return await web3Manager.getGasPrice()
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [])
  
  const estimateGas = useCallback(async (contractName: any, methodName: string, params: any[]) => {
    try {
      return await web3Manager.estimateGas(contractName, methodName, params)
    } catch (error: any) {
      setError(error.message)
      throw error
    }
  }, [])
  
  return {
    isConnected,
    address,
    network,
    isConnecting,
    error,
    connect,
    disconnect,
    getTokenBalance,
    stakeTokens,
    unstakeTokens,
    createCampaign,
    getStakedAmount,
    calculateRewards,
    claimRewards,
    getGasPrice,
    estimateGas
  }
}