import type { Address } from 'viem';

/**
 * Represents a token approval found during scanning
 */
export interface TokenApproval {
  tokenAddress: Address;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  spenderAddress: Address;
  spenderName: string | null;
  spenderVerified: boolean;
  allowance: bigint;
  lastUsed: number | null; // Unix timestamp
  blockNumber: bigint;
  transactionHash: string;
}

/**
 * Risk level categories
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk score for an individual approval
 */
export interface RiskScore {
  score: number; // 0-100
  level: RiskLevel;
  factors: string[];
  recommendation: string;
}

/**
 * Full risk assessment for a wallet
 */
export interface WalletRiskAssessment {
  walletAddress: Address;
  scanTimestamp: number;
  chainId: number;
  totalApprovals: number;
  overallRiskScore: number;
  overallRiskLevel: RiskLevel;
  approvals: ApprovalWithRisk[];
  summary: RiskSummary;
}

/**
 * Token approval with its calculated risk
 */
export interface ApprovalWithRisk extends TokenApproval {
  risk: RiskScore;
}

/**
 * Summary statistics for the report
 */
export interface RiskSummary {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  unlimitedApprovals: number;
  dormantApprovals: number;
  recommendedRevocations: number;
}

/**
 * Configuration for the scanner
 */
export interface ScannerConfig {
  rpcUrl: string;
  chainId: number;
  fromBlock?: bigint;
  toBlock?: bigint;
}

/**
 * Output format options
 */
export type OutputFormat = 'json' | 'table' | 'minimal';

/**
 * CLI options
 */
export interface CLIOptions {
  wallet: Address;
  rpcUrl?: string;
  chainId?: number;
  output?: string;
  format?: OutputFormat;
  verbose?: boolean;
}
