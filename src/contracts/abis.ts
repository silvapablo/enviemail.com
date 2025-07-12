export const TRUST_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function mintReward(address to, uint256 amount, uint256 campaignId)",
  "function burn(uint256 amount)",
  "function addAuthorizedMinter(address minter)",
  "function removeAuthorizedMinter(address minter)",
  "function authorizedMinters(address) view returns (bool)",
  "function getTokenStats() view returns (uint256, uint256, uint256, bool)",
  "function getUserStats(address user) view returns (uint256, uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TokensMinted(address indexed to, uint256 amount, string reason)",
  "event RewardDistributed(address indexed validator, uint256 amount, uint256 campaignId)"
] as const

export const EMAIL_VALIDATION_ABI = [
  "function createCampaign(string title, string emailContent, uint256 rewardPool, uint256 requiredStake)",
  "function validateEmail(uint256 campaignId, bool isLegitimate, uint256 confidence, string reasoning)",
  "function resolveCampaign(uint256 campaignId)",
  "function getCampaignDetails(uint256 campaignId) view returns (address, string, string, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool)",
  "function hasUserValidated(uint256 campaignId, address user) view returns (bool)",
  "function getValidatorStats(address validator) view returns (uint256, uint256, uint256, uint256)",
  "function getCampaignValidators(uint256 campaignId) view returns (address[])",
  "function nextCampaignId() view returns (uint256)",
  "function minimumStake() view returns (uint256)",
  "function minimumRewardPool() view returns (uint256)",
  "function validationPeriod() view returns (uint256)",
  "function consensusThreshold() view returns (uint256)",
  "function emergencyPause()",
  "function emergencyUnpause()",
  "function isPaused() view returns (bool)",
  "event CampaignCreated(uint256 indexed campaignId, address indexed sender, string title, uint256 rewardPool, uint256 deadline)",
  "event EmailValidated(uint256 indexed campaignId, address indexed validator, bool isLegitimate, uint256 confidence, uint256 rewardEarned)",
  "event CampaignResolved(uint256 indexed campaignId, bool finalResult, uint256 totalRewardsDistributed)",
  "event ValidatorSlashed(address indexed validator, uint256 amount, string reason)",
  "event ReputationUpdated(address indexed user, uint256 oldScore, uint256 newScore)"
] as const

// Endereços dos contratos deployados
export const CONTRACT_ADDRESSES = {
  TRUST_TOKEN: "0x47BB87e14203aD85651ee35Eb821F3FdD7E3634b",
  EMAIL_VALIDATION: "0x15F5aE636A01F87DD0Fbb379F75Cc4A384df7089"
} as const

// Configuração da rede Polygon Amoy Testnet
export const NETWORK_CONFIG = {
  chainId: 80002,
  name: "Polygon Amoy Testnet",
  rpcUrl: "https://polygon-amoy.drpc.org",
  blockExplorer: "https://amoy.polygonscan.com",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18
  },
  faucet: "https://faucet.polygon.technology/"
} as const

// Configurações do protocolo
export const PROTOCOL_CONFIG = {
  MINIMUM_STAKE: "10", // 10 TRUST tokens
  MINIMUM_REWARD_POOL: "100", // 100 TRUST tokens
  VALIDATION_PERIOD: 86400, // 24 hours in seconds
  CONSENSUS_THRESHOLD: 66, // 66% consensus required
  VALIDATOR_REWARD_PERCENTAGE: 80, // 80% of reward pool goes to validators
  PROTOCOL_FEE_PERCENTAGE: 5, // 5% protocol fee
  REPUTATION_MULTIPLIER: 1000 // 1000 reputation points per successful validation
} as const

// Tipos para TypeScript
export interface CampaignDetails {
  sender: string
  title: string
  emailContent: string
  rewardPool: bigint
  requiredStake: bigint
  validationsCount: bigint
  legitimateVotes: bigint
  spamVotes: bigint
  deadline: bigint
  isResolved: boolean
  finalResult: boolean
}

export interface ValidatorStats {
  totalValidations: bigint
  correctValidations: bigint
  totalRewardsEarned: bigint
  reputationScore: bigint
}

export interface TokenStats {
  totalSupply: bigint
  circulatingSupply: bigint
  totalBurned: bigint
  isPaused: boolean
}