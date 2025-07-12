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

      // Create Supabase-compatible email format
      const supabaseEmail = `user-${address.toLowerCase().substring(2)}@emailchain.protocol`
      
      // Authenticate with Supabase using formatted email
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: supabaseEmail,
        password: address.toLowerCase()
      })

      if (signInError) {
        // Create auth user if doesn't exist
        const { error: signUpError } = await supabase.auth.signUp({
          email: supabaseEmail,
          password: address.toLowerCase()
        })
        
        if (signUpError && !signUpError.message.includes('already registered')) {
          throw new Error(`Authentication failed: ${signUpError.message}`)
        }
        
        // Try signing in again
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: supabaseEmail,
          password: address.toLowerCase()
        })
        
        if (retryError) {
          throw new Error(`Authentication retry failed: ${retryError.message}`)
        }
      }

      this.currentUser = user
      
      // Store in localStorage for persistence
      localStorage.setItem('emailchain_user', JSON.stringify(user))
      localStorage.setItem('emailchain_wallet', address)

      return { user, address }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      throw error
    }
  }

  static async disconnectWallet(): Promise<void> {
    try {
      await supabase.auth.signOut()
      this.currentUser = null
      
      // Clear localStorage
      localStorage.removeItem('emailchain_user')
      localStorage.removeItem('emailchain_wallet')
      
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
      // Check Supabase auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        // Try to restore from localStorage
        const storedUser = localStorage.getItem('emailchain_user')
        const storedWallet = localStorage.getItem('emailchain_wallet')
        
        if (storedUser && storedWallet) {
          const user = JSON.parse(storedUser)
          // Verify user still exists in database
          const dbUser = await DatabaseService.getUserByWallet(storedWallet)
          if (dbUser) {
            this.currentUser = dbUser
            return dbUser
          }
        }
        return null
      }

      // Extract wallet address from Supabase email format
      const emailPrefix = authUser.email?.split('@')[0]
      const walletAddress = emailPrefix?.startsWith('user-') 
        ? `0x${emailPrefix.substring(5)}` 
        : emailPrefix
        
      if (!walletAddress) {
        throw new Error('Invalid user email format')
      }

      // Get user from database
      const user = await DatabaseService.getUserByWallet(walletAddress)
      if (user) {
        this.currentUser = user
        localStorage.setItem('emailchain_user', JSON.stringify(user))
      }

      return user
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
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
    this.currentUser = null
  }
}