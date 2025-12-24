import { Address } from 'viem';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'safe';

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
  contractType?: string;
}

export interface Approval {
  tokenAddress: Address;
  tokenInfo: TokenInfo;
  spenderAddress: Address;
  spenderInfo: SpenderInfo;
  allowance: bigint;
  isUnlimited: boolean;
  lastUpdated?: Date;
  transactionHash?: string;
}

export interface RiskFactor {
  name: string;
  description: string;
  impact: number;
}

export interface RiskScore {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
}

export interface RevocationRecommendation {
  approval: Approval;
  riskScore: RiskScore;
  shouldRevoke: boolean;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedGasCost: bigint;
  createdAt: Date;
}

export interface ScanResult {
  walletAddress: Address;
  chainId: number;
  approvals: Approval[];
  scannedAt: Date;
}

export interface RiskReport {
  scanResult: ScanResult;
  riskScores: Map<string, RiskScore>;
  recommendations: RevocationRecommendation[];
  summary: ReportSummary;
  generatedAt: Date;
}

export interface ReportSummary {
  totalApprovals: number;
  criticalRisk: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  safeApprovals: number;
  recommendedRevocations: number;
  estimatedTotalGasCost: bigint;
}

export interface ScanOptions {
  walletAddress: Address;
  chainId?: number;
  rpcUrl?: string;
  includeZeroAllowances?: boolean;
}

export interface ReportOptions {
  format: 'json' | 'text' | 'csv';
  outputPath?: string;
  verbose?: boolean;
}
