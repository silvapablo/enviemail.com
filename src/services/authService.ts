import { supabase, DatabaseService, User } from './supabaseService'
import { ethers } from 'ethers'

export class AuthService {
  private static currentUser: User | null = null

  static async connectWallet(): Promise<{ user: User; address: string }> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask to continue.')
    }

    try {
      // Request wallet connection
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      // Verify signature for authentication
      const message = `Sign this message to authenticate with EmailChain Protocol: ${Date.now()}`
      const signature = await signer.signMessage(message)
      
      if (!signature) {
        throw new Error('Signature required for authentication')
      }

      // Create or get user from database
      let user = await DatabaseService.getUserByWallet(address)
      
      if (!user) {
        // Create new user
        user = await DatabaseService.createUser({
          wallet_address: address,
          reputation_score: 0,
          trust_tokens: 1000, // Starting bonus
          tier: 'Bronze',
          is_validator: false,
          total_campaigns: 0,
          successful_campaigns: 0,
          validation_accuracy: 0
        })
        
        console.log('✅ New user created:', user)
      } else {
        console.log('✅ Existing user logged in:', user)
      }

      // Store user session locally (wallet-based authentication)
      this.currentUser = user
      localStorage.setItem('emailchain_user', JSON.stringify(user))
      localStorage.setItem('emailchain_wallet', address)
      localStorage.setItem('emailchain_authenticated', 'true')
      
      console.log('✅ Wallet authentication successful')

      return { user, address }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      throw error
    }
  }

  static async disconnectWallet(): Promise<void> {
    try {
      this.currentUser = null
      
      // Clear localStorage
      localStorage.removeItem('emailchain_user')
      localStorage.removeItem('emailchain_wallet')
      localStorage.removeItem('emailchain_authenticated')
      
      console.log('✅ User disconnected')
    } catch (error) {
      console.error('Disconnect failed:', error)
      throw error
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    // Return cached user if available
    if (this.currentUser) {
      return this.currentUser
    }

    try {
      // Check wallet-based authentication
      const isAuthenticated = localStorage.getItem('emailchain_authenticated')
      const storedUser = localStorage.getItem('emailchain_user')
      const storedWallet = localStorage.getItem('emailchain_wallet')
      
      if (isAuthenticated === 'true' && storedUser && storedWallet) {
        const user = JSON.parse(storedUser)
        // Verify user still exists in database
        const dbUser = await DatabaseService.getUserByWallet(storedWallet)
        if (dbUser) {
          this.currentUser = dbUser
          // Update stored user data with fresh data
          localStorage.setItem('emailchain_user', JSON.stringify(dbUser))
          return dbUser
        } else {
          // Clear invalid data
          this.clearStoredData()
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const isAuthenticated = localStorage.getItem('emailchain_authenticated')
      const storedUser = localStorage.getItem('emailchain_user')
      const storedWallet = localStorage.getItem('emailchain_wallet')
      
      return isAuthenticated === 'true' && !!storedUser && !!storedWallet
    } catch (error) {
      console.error('Auth check failed:', error)
      return false
    }
  }

  static async refreshUser(): Promise<User | null> {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return null

      // Fetch fresh data from database
      const freshUser = await DatabaseService.getUserByWallet(currentUser.wallet_address)
      if (freshUser) {
        this.currentUser = freshUser
        localStorage.setItem('emailchain_user', JSON.stringify(freshUser))
      }

      return freshUser
    } catch (error) {
      console.error('Failed to refresh user:', error)
      return null
    }
  }

  static async updateUserProfile(updates: Partial<User>): Promise<User> {
    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      throw new Error('No authenticated user')
    }

    try {
      const updatedUser = await DatabaseService.updateUser(currentUser.id, updates)
      this.currentUser = updatedUser
      localStorage.setItem('emailchain_user', JSON.stringify(updatedUser))
      return updatedUser
    } catch (error) {
      console.error('Failed to update user profile:', error)
      throw error
    }
  }

  static getStoredWalletAddress(): string | null {
    return localStorage.getItem('emailchain_wallet')
  }

  static clearStoredData(): void {
    localStorage.removeItem('emailchain_user')
    localStorage.removeItem('emailchain_wallet')
    localStorage.removeItem('emailchain_authenticated')
    this.currentUser = null
  }
}