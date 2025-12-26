import type { Address } from 'viem';

export interface ApprovalEvent {
  tokenAddress: Address;
  owner: Address;
  spender: Address;
  value: bigint;
  blockNumber: bigint;
  transactionHash: string;
}

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
}

export interface SpenderInfo {
  address: Address;
  name?: string;
  isVerified: boolean;
  contractAge?: number;
  lastActivity?: Date;
}

export interface ApprovalDetails {
  token: TokenInfo;
  spender: SpenderInfo;
  allowance: bigint;
  isUnlimited: boolean;
  lastUsed?: Date;
  approvalDate: Date;
  riskScore: number;
  riskFactors: RiskFactor[];
}

export interface RiskFactor {
  type: RiskFactorType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  weight: number;
}

export type RiskFactorType =
  | 'unlimited_approval'
  | 'dormant_approval'
  | 'unverified_spender'
  | 'new_contract'
  | 'high_value'
  | 'inactive_spender'
  | 'suspicious_pattern';

export interface RiskAssessment {
  walletAddress: Address;
  scanDate: Date;
  totalApprovals: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  overallRiskScore: number;
  approvals: ApprovalDetails[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'revoke' | 'reduce' | 'monitor';
  priority: 'immediate' | 'soon' | 'optional';
  approval: ApprovalDetails;
  reason: string;
}

export interface ReportOptions {
  format: 'json' | 'markdown' | 'csv';
  includeRecommendations: boolean;
  minRiskScore?: number;
  outputPath?: string;
}

export interface ScanOptions {
  fromBlock?: bigint;
  toBlock?: bigint;
  tokenAddresses?: Address[];
  useCache?: boolean;
  onProgress?: (progress: ScanProgress) => void;
}

export interface ScanProgress {
  phase: 'scanning' | 'processing' | 'analyzing' | 'complete';
  current: number;
  total: number;
  message: string;
}

export interface RevocationRequest {
  tokenAddress: Address;
  spenderAddress: Address;
}

export interface RevocationResult {
  success: boolean;
  tokenAddress: Address;
  spenderAddress: Address;
  transactionHash?: string;
  error?: string;
}

export interface BatchRevocationResult {
  successful: RevocationResult[];
  failed: RevocationResult[];
  totalGasUsed?: bigint;
}

export interface CLIOptions {
  wallet: string;
  rpc?: string;
  output?: string;
  format?: 'json' | 'markdown' | 'csv';
  minRisk?: number;
  revoke?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}
