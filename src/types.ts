import { Address } from 'viem';

export interface ApprovalData {
  tokenAddress: Address;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  spenderAddress: Address;
  spenderName?: string;
  allowance: bigint;
  isUnlimited: boolean;
  lastUpdatedBlock?: number;
  lastUpdatedTimestamp?: Date;
}

export interface RiskAssessment {
  tokenAddress: Address;
  spenderAddress: Address;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

export interface RevocationRecommendation {
  tokenAddress: Address;
  tokenSymbol: string;
  spenderAddress: Address;
  spenderName?: string;
  shouldRevoke: boolean;
  priority: number;
  reason: string;
  estimatedGas?: bigint;
}

export interface ScanOptions {
  rpcUrl: string;
  chainId: number;
  fromBlock?: bigint;
  toBlock?: bigint;
  batchSize?: number;
}

export interface Config {
  rpcUrl: string;
  chainId: number;
  maxBlockRange: number;
  requestsPerSecond: number;
  unlimitedThreshold: bigint;
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
  riskScore: number;
}

export type ReportFormat = 'json' | 'text' | 'csv';

export interface ApprovalReportSummary {
  totalApprovals: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  totalRiskScore: number;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApprovalReportDetail {
  approval: ApprovalData;
  riskAssessment: RiskAssessment;
  recommendation?: RevocationRecommendation;
}

export interface ApprovalReport {
  walletAddress: string;
  generatedAt: string;
  summary: ApprovalReportSummary;
  approvals: ApprovalReportDetail[];
  recommendations: RevocationRecommendation[];
}

export interface BatchItem<T> {
  data: T;
  index: number;
}

export interface BatchResult<T, R> {
  item: BatchItem<T>;
  result?: R;
  error?: Error;
}
