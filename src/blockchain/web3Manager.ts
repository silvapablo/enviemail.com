import { ethers } from 'ethers'

interface ContractConfig {
  address: string
  abi: any[]
}

interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  blockExplorer: string
}

const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://etherscan.io'
  },
  goerli: {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
    blockExplorer: 'https://goerli.etherscan.io'
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com'
  }
}

const CONTRACTS: Record<string, ContractConfig> = {
  staking: {
    address: process.env.REACT_APP_STAKING_CONTRACT || '0x0000000000000000000000000000000000000000',
    abi: [
      'function stake(uint256 amount) external',
      'function unstake(uint256 amount) external',
      'function getStakedAmount(address user) external view returns (uint256)',
      'function calculateRewards(address user) external view returns (uint256)',
      'function claimRewards() external',
      'event Staked(address indexed user, uint256 amount)',
      'event Unstaked(address indexed user, uint256 amount)',
      'event RewardsClaimed(address indexed user, uint256 amount)'
    ]
  },
  campaign: {
    address: process.env.REACT_APP_CAMPAIGN_CONTRACT || '0x0000000000000000000000000000000000000000',
    abi: [
      'function createCampaign(uint256 targetAudience, uint256 qualityThreshold, uint256 stakeAmount) external returns (uint256)',
      'function updateCampaignMetrics(uint256 campaignId, uint256 opens, uint256 clicks, uint256 spamReports) external',
      'function completeCampaign(uint256 campaignId) external',
      'function getCampaign(uint256 campaignId) external view returns (tuple(uint256 id, address creator, uint256 targetAudience, uint256 qualityThreshold, uint256 stakeAmount, uint8 status))',
      'event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 stakeAmount)',
      'event CampaignCompleted(uint256 indexed campaignId, bool successful, uint256 reputationChange)'
    ]
  },
  token: {
    address: process.env.REACT_APP_TOKEN_CONTRACT || '0x0000000000000000000000000000000000000000',
    abi: [
      'function balanceOf(address account) external view returns (uint256)',
      'function transfer(address to, uint256 amount) external returns (bool)',
      'function approve(address spender, uint256 amount) external returns (bool)',
      'function allowance(address owner, address spender) external view returns (uint256)',
      'function totalSupply() external view returns (uint256)',
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)'
    ]
  }
}

export class Web3Manager {
  private provider: ethers.providers.Web3Provider | null = null
  private signer: ethers.Signer | null = null
  private contracts: Map<string, ethers.Contract> = new Map()
  private currentNetwork: NetworkConfig | null = null
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map()
  
  constructor() {
    this.setupEventListeners()
  }
  
  private setupEventListeners(): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this))
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this))
      window.ethereum.on('disconnect', this.handleDisconnect.bind(this))
    }
  }
  
  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      this.disconnect()
    } else {
      this.emit('accountChanged', accounts[0])
    }
  }
  
  private handleChainChanged(chainId: string): void {
    const networkId = parseInt(chainId, 16)
    const network = Object.values(NETWORKS).find(n => n.chainId === networkId)
    this.currentNetwork = network || null
    this.emit('networkChanged', network)
  }
  
  private handleDisconnect(): void {
    this.disconnect()
    this.emit('disconnected')
  }
  
  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please install MetaMask to continue.')
    }
    
    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum)
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.')
      }
      
      this.signer = this.provider.getSigner()
      const address = await this.signer.getAddress()
      
      // Get current network
      const network = await this.provider.getNetwork()
      this.currentNetwork = Object.values(NETWORKS).find(n => n.chainId === network.chainId) || null
      
      // Ensure we're on the correct network
      await this.ensureCorrectNetwork()
      
      this.emit('connected', address)
      return address
      
    } catch (error) {
      console.error('Wallet connection failed:', error)
      throw error
    }
  }
  
  private async ensureCorrectNetwork(): Promise<void> {
    const targetChainId = parseInt(process.env.REACT_APP_CHAIN_ID || '1')
    const network = await this.provider!.getNetwork()
    
    if (network.chainId !== targetChainId) {
      const targetNetwork = Object.values(NETWORKS).find(n => n.chainId === targetChainId)
      
      if (!targetNetwork) {
        throw new Error(`Unsupported network. Chain ID ${targetChainId} not configured.`)
      }
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }]
        })
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await this.addNetwork(targetNetwork)
        } else {
          throw switchError
        }
      }
    }
  }
  
  private async addNetwork(network: NetworkConfig): Promise<void> {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${network.chainId.toString(16)}`,
        chainName: network.name,
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.blockExplorer]
      }]
    })
  }
  
  async getContract(contractName: keyof typeof CONTRACTS): Promise<ethers.Contract> {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }
    
    if (!this.contracts.has(contractName)) {
      const config = CONTRACTS[contractName]
      if (!config) {
        throw new Error(`Contract ${contractName} not configured`)
      }
      
      const contract = new ethers.Contract(config.address, config.abi, this.signer)
      this.contracts.set(contractName, contract)
      
      // Setup event listeners
      this.setupContractEventListeners(contractName, contract)
    }
    
    return this.contracts.get(contractName)!
  }
  
  private setupContractEventListeners(contractName: string, contract: ethers.Contract): void {
    // Listen to all events and emit them
    contract.on('*', (event) => {
      this.emit(`${contractName}:${event.event}`, event)
    })
  }
  
  // Token operations
  async getTokenBalance(address?: string): Promise<string> {
    const tokenContract = await this.getContract('token')
    const userAddress = address || await this.signer!.getAddress()
    const balance = await tokenContract.balanceOf(userAddress)
    return ethers.utils.formatEther(balance)
  }
  
  async approveToken(spender: string, amount: string): Promise<ethers.ContractTransaction> {
    const tokenContract = await this.getContract('token')
    const tx = await tokenContract.approve(spender, ethers.utils.parseEther(amount))
    return tx
  }
  
  // Staking operations
  async stakeTokens(amount: string): Promise<ethers.ContractTransaction> {
    const stakingContract = await this.getContract('staking')
    const tokenContract = await this.getContract('token')
    
    // First approve the staking contract to spend tokens
    const approveTx = await tokenContract.approve(
      CONTRACTS.staking.address,
      ethers.utils.parseEther(amount)
    )
    await approveTx.wait()
    
    // Then stake the tokens
    const stakeTx = await stakingContract.stake(ethers.utils.parseEther(amount))
    return stakeTx
  }
  
  async unstakeTokens(amount: string): Promise<ethers.ContractTransaction> {
    const stakingContract = await this.getContract('staking')
    const tx = await stakingContract.unstake(ethers.utils.parseEther(amount))
    return tx
  }
  
  async getStakedAmount(address?: string): Promise<string> {
    const stakingContract = await this.getContract('staking')
    const userAddress = address || await this.signer!.getAddress()
    const stakedAmount = await stakingContract.getStakedAmount(userAddress)
    return ethers.utils.formatEther(stakedAmount)
  }
  
  async calculateRewards(address?: string): Promise<string> {
    const stakingContract = await this.getContract('staking')
    const userAddress = address || await this.signer!.getAddress()
    const rewards = await stakingContract.calculateRewards(userAddress)
    return ethers.utils.formatEther(rewards)
  }
  
  async claimRewards(): Promise<ethers.ContractTransaction> {
    const stakingContract = await this.getContract('staking')
    const tx = await stakingContract.claimRewards()
    return tx
  }
  
  // Campaign operations
  async createCampaign(
    targetAudience: number,
    qualityThreshold: number,
    stakeAmount: string
  ): Promise<ethers.ContractTransaction> {
    const campaignContract = await this.getContract('campaign')
    const tokenContract = await this.getContract('token')
    
    // Approve campaign contract to spend tokens
    const approveTx = await tokenContract.approve(
      CONTRACTS.campaign.address,
      ethers.utils.parseEther(stakeAmount)
    )
    await approveTx.wait()
    
    // Create campaign
    const tx = await campaignContract.createCampaign(
      targetAudience,
      qualityThreshold,
      ethers.utils.parseEther(stakeAmount)
    )
    
    return tx
  }
  
  async updateCampaignMetrics(
    campaignId: number,
    opens: number,
    clicks: number,
    spamReports: number
  ): Promise<ethers.ContractTransaction> {
    const campaignContract = await this.getContract('campaign')
    const tx = await campaignContract.updateCampaignMetrics(
      campaignId,
      opens,
      clicks,
      spamReports
    )
    return tx
  }
  
  async completeCampaign(campaignId: number): Promise<ethers.ContractTransaction> {
    const campaignContract = await this.getContract('campaign')
    const tx = await campaignContract.completeCampaign(campaignId)
    return tx
  }
  
  async getCampaign(campaignId: number): Promise<any> {
    const campaignContract = await this.getContract('campaign')
    const campaign = await campaignContract.getCampaign(campaignId)
    return campaign
  }
  
  // Transaction utilities
  async getTransactionReceipt(txHash: string): Promise<ethers.ContractReceipt> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }
    
    return this.provider.waitForTransaction(txHash)
  }
  
  async estimateGas(
    contractName: keyof typeof CONTRACTS,
    methodName: string,
    params: any[]
  ): Promise<string> {
    const contract = await this.getContract(contractName)
    const gasEstimate = await contract.estimateGas[methodName](...params)
    return ethers.utils.formatUnits(gasEstimate, 'gwei')
  }
  
  async getGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }
    
    const gasPrice = await this.provider.getGasPrice()
    return ethers.utils.formatUnits(gasPrice, 'gwei')
  }
  
  // Network utilities
  getCurrentNetwork(): NetworkConfig | null {
    return this.currentNetwork
  }
  
  async getBlockNumber(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }
    
    return this.provider.getBlockNumber()
  }
  
  // Event system
  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }
  
  off(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }
  
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }
  
  // Cleanup
  disconnect(): void {
    this.provider = null
    this.signer = null
    this.contracts.clear()
    this.currentNetwork = null
    this.eventListeners.clear()
  }
  
  isConnected(): boolean {
    return this.provider !== null && this.signer !== null
  }
  
  async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }
    return this.signer.getAddress()
  }
}

// Export singleton instance
export const web3Manager = new Web3Manager()