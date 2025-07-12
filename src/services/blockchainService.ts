import { ethers } from 'ethers'
import { 
  TRUST_TOKEN_ABI, 
  EMAIL_VALIDATION_ABI, 
  CONTRACT_ADDRESSES, 
  NETWORK_CONFIG,
  PROTOCOL_CONFIG,
  type CampaignDetails,
  type ValidatorStats,
  type TokenStats
} from '../contracts/abis'

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.Signer | null = null
  private trustContract: ethers.Contract | null = null
  private validationContract: ethers.Contract | null = null
  private isConnected = false

  constructor() {
    this.initializeProvider()
  }

  private async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this))
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this))
    }
  }

  private handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      this.disconnect()
    } else {
      // Reconnect with new account
      this.connect().catch(console.error)
    }
  }

  private handleChainChanged(chainId: string) {
    // Reload page on chain change for simplicity
    window.location.reload()
  }

  async connect(): Promise<string> {
    if (!this.provider) {
      throw new Error('MetaMask not found. Please install MetaMask to continue.')
    }

    try {
      // Request account access
      await this.provider.send("eth_requestAccounts", [])
      
      // Ensure correct network
      await this.ensureCorrectNetwork()
      
      // Get signer
      this.signer = await this.provider.getSigner()
      const address = await this.signer.getAddress()

      // Initialize contracts
      this.trustContract = new ethers.Contract(
        CONTRACT_ADDRESSES.TRUST_TOKEN,
        TRUST_TOKEN_ABI,
        this.signer
      )
      
      this.validationContract = new ethers.Contract(
        CONTRACT_ADDRESSES.EMAIL_VALIDATION,
        EMAIL_VALIDATION_ABI,
        this.signer
      )

      this.isConnected = true
      console.log('✅ Blockchain connected:', address)
      console.log('🔗 Network:', NETWORK_CONFIG.name)
      console.log('📄 Trust Token:', CONTRACT_ADDRESSES.TRUST_TOKEN)
      console.log('📄 Validation Contract:', CONTRACT_ADDRESSES.EMAIL_VALIDATION)

      return address
    } catch (error) {
      console.error('❌ Blockchain connection failed:', error)
      throw error
    }
  }

  private async ensureCorrectNetwork() {
    if (!this.provider) return

    try {
      const network = await this.provider.getNetwork()
      
      if (network.chainId !== BigInt(NETWORK_CONFIG.chainId)) {
        try {
          await this.provider.send("wallet_switchEthereumChain", [
            { chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }
          ])
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await this.provider.send("wallet_addEthereumChain", [{
              chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
              chainName: NETWORK_CONFIG.name,
              rpcUrls: [NETWORK_CONFIG.rpcUrl],
              nativeCurrency: NETWORK_CONFIG.nativeCurrency,
              blockExplorerUrls: [NETWORK_CONFIG.blockExplorer]
            }])
          } else {
            throw switchError
          }
        }
      }
    } catch (error) {
      console.error('Failed to switch network:', error)
      throw new Error(`Please switch to ${NETWORK_CONFIG.name} in MetaMask`)
    }
  }

  disconnect() {
    this.signer = null
    this.trustContract = null
    this.validationContract = null
    this.isConnected = false
    console.log('✅ Blockchain disconnected')
  }

  // Token operations
  async getTrustBalance(address?: string): Promise<string> {
    if (!this.trustContract) throw new Error('Not connected to blockchain')
    
    try {
      const userAddress = address || await this.signer!.getAddress()
      const balance = await this.trustContract.balanceOf(userAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Failed to get token balance:', error)
      return '0'
    }
  }

  async getTokenStats(): Promise<TokenStats> {
    if (!this.trustContract) throw new Error('Not connected to blockchain')
    
    try {
      const [totalSupply, circulatingSupply, totalBurned, isPaused] = await this.trustContract.getTokenStats()
      return {
        totalSupply,
        circulatingSupply,
        totalBurned,
        isPaused
      }
    } catch (error) {
      console.error('Failed to get token stats:', error)
      throw error
    }
  }

  async transferTokens(to: string, amount: string): Promise<string> {
    if (!this.trustContract) throw new Error('Not connected to blockchain')
    
    try {
      const amountWei = ethers.parseEther(amount)
      const tx = await this.trustContract.transfer(to, amountWei)
      await tx.wait()
      
      console.log('✅ Tokens transferred:', tx.hash)
      return tx.hash
    } catch (error) {
      console.error('❌ Token transfer failed:', error)
      throw error
    }
  }

  async approveTokens(spender: string, amount: string): Promise<string> {
    if (!this.trustContract) throw new Error('Not connected to blockchain')
    
    try {
      const amountWei = ethers.parseEther(amount)
      const tx = await this.trustContract.approve(spender, amountWei)
      await tx.wait()
      
      console.log('✅ Tokens approved:', tx.hash)
      return tx.hash
    } catch (error) {
      console.error('❌ Token approval failed:', error)
      throw error
    }
  }

  // Campaign operations
  async createCampaign(title: string, emailContent: string, rewardPool: string, requiredStake: string): Promise<string> {
    if (!this.validationContract || !this.trustContract) {
      throw new Error('Not connected to blockchain')
    }

    try {
      // Validate minimum amounts
      const rewardPoolNum = parseFloat(rewardPool)
      const requiredStakeNum = parseFloat(requiredStake)
      
      if (rewardPoolNum < parseFloat(PROTOCOL_CONFIG.MINIMUM_REWARD_POOL)) {
        throw new Error(`Minimum reward pool is ${PROTOCOL_CONFIG.MINIMUM_REWARD_POOL} TRUST`)
      }
      
      if (requiredStakeNum < parseFloat(PROTOCOL_CONFIG.MINIMUM_STAKE)) {
        throw new Error(`Minimum stake is ${PROTOCOL_CONFIG.MINIMUM_STAKE} TRUST`)
      }

      // Approve tokens for the validation contract
      const rewardWei = ethers.parseEther(rewardPool)
      const approveTx = await this.trustContract.approve(CONTRACT_ADDRESSES.EMAIL_VALIDATION, rewardWei)
      await approveTx.wait()
      console.log('✅ Tokens approved for campaign creation')

      // Create campaign
      const stakeWei = ethers.parseEther(requiredStake)
      const tx = await this.validationContract.createCampaign(title, emailContent, rewardWei, stakeWei)
      const receipt = await tx.wait()

      // Extract campaign ID from events
      let campaignId: number | undefined
      for (const log of receipt.logs) {
        try {
          const parsed = this.validationContract.interface.parseLog(log)
          if (parsed?.name === 'CampaignCreated') {
            campaignId = parseInt(parsed.args.campaignId.toString())
            break
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      console.log('✅ Campaign created on blockchain:', tx.hash, 'ID:', campaignId)
      return tx.hash
    } catch (error) {
      console.error('❌ Campaign creation failed:', error)
      throw error
    }
  }

  async validateEmail(campaignId: number, isLegitimate: boolean, confidence: number, reasoning: string): Promise<string> {
    if (!this.validationContract || !this.trustContract) {
      throw new Error('Not connected to blockchain')
    }

    try {
      // Get campaign details to check required stake
      const campaignDetails = await this.getCampaignDetails(campaignId)
      const requiredStake = campaignDetails.requiredStake

      // Approve stake amount
      const approveTx = await this.trustContract.approve(CONTRACT_ADDRESSES.EMAIL_VALIDATION, requiredStake)
      await approveTx.wait()
      console.log('✅ Stake approved for validation')

      // Submit validation
      const tx = await this.validationContract.validateEmail(campaignId, isLegitimate, confidence, reasoning)
      await tx.wait()

      console.log('✅ Email validated on blockchain:', tx.hash)
      return tx.hash
    } catch (error) {
      console.error('❌ Email validation failed:', error)
      throw error
    }
  }

  async getCampaignDetails(campaignId: number): Promise<CampaignDetails> {
    if (!this.validationContract) throw new Error('Not connected to blockchain')
    
    try {
      const details = await this.validationContract.getCampaignDetails(campaignId)
      return {
        sender: details[0],
        title: details[1],
        emailContent: details[2],
        rewardPool: details[3],
        requiredStake: details[4],
        validationsCount: details[5],
        legitimateVotes: details[6],
        spamVotes: details[7],
        deadline: details[8],
        isResolved: details[9],
        finalResult: details[10]
      }
    } catch (error) {
      console.error('Failed to get campaign details:', error)
      throw error
    }
  }

  async getValidatorStats(address?: string): Promise<ValidatorStats> {
    if (!this.validationContract) throw new Error('Not connected to blockchain')
    
    try {
      const userAddress = address || await this.signer!.getAddress()
      const stats = await this.validationContract.getValidatorStats(userAddress)
      return {
        totalValidations: stats[0],
        correctValidations: stats[1],
        totalRewardsEarned: stats[2],
        reputationScore: stats[3]
      }
    } catch (error) {
      console.error('Failed to get validator stats:', error)
      throw error
    }
  }

  async hasUserValidated(campaignId: number, address?: string): Promise<boolean> {
    if (!this.validationContract) throw new Error('Not connected to blockchain')
    
    try {
      const userAddress = address || await this.signer!.getAddress()
      return await this.validationContract.hasUserValidated(campaignId, userAddress)
    } catch (error) {
      console.error('Failed to check validation status:', error)
      return false
    }
  }

  async resolveCampaign(campaignId: number): Promise<string> {
    if (!this.validationContract) throw new Error('Not connected to blockchain')
    
    try {
      const tx = await this.validationContract.resolveCampaign(campaignId)
      await tx.wait()
      
      console.log('✅ Campaign resolved:', tx.hash)
      return tx.hash
    } catch (error) {
      console.error('❌ Campaign resolution failed:', error)
      throw error
    }
  }

  // Utility methods
  getContractAddresses() {
    return CONTRACT_ADDRESSES
  }

  getNetworkConfig() {
    return NETWORK_CONFIG
  }

  getProtocolConfig() {
    return PROTOCOL_CONFIG
  }

  isContractConnected(): boolean {
    return this.isConnected && !!this.trustContract && !!this.validationContract
  }

  async getBlockNumber(): Promise<number> {
    if (!this.provider) throw new Error('Provider not initialized')
    return await this.provider.getBlockNumber()
  }

  async getGasPrice(): Promise<string> {
    if (!this.provider) throw new Error('Provider not initialized')
    const gasPrice = await this.provider.getFeeData()
    return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei')
  }

  async estimateGas(contractMethod: string, ...args: any[]): Promise<string> {
    if (!this.validationContract) throw new Error('Not connected to blockchain')
    
    try {
      const gasEstimate = await this.validationContract[contractMethod].estimateGas(...args)
      return ethers.formatUnits(gasEstimate, 'gwei')
    } catch (error) {
      console.error('Gas estimation failed:', error)
      return '0'
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService()