import { Address } from 'viem';

export interface ApprovalData {
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  spenderAddress: string;
  spenderName?: string;
  ownerAddress: string;
  allowance: string;
  isUnlimited: boolean;
  blockNumber: number;
  transactionHash: string;
  riskScore: number;
  riskFactors: string[];
  lastUsed?: string;
  approvalDate?: string;
}

export interface ScanOptions {
  fromBlock?: bigint;
  toBlock?: bigint;
  forceRefresh?: boolean;
  includeZeroAllowances?: boolean;
}

export interface ScanSummary {
  totalApprovals: number;
  unlimitedApprovals: number;
  highRiskApprovals: number;
  mediumRiskApprovals: number;
  lowRiskApprovals: number;
  averageRiskScore: number;
}

export interface ScanMetadata {
  scanTime: string;
  durationMs: number;
  fromCache: boolean;
  rpcUrl: string;
}

export interface ScanResult {
  walletAddress: string;
  approvals: ApprovalData[];
  summary: ScanSummary;
  scanMetadata: ScanMetadata;
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface SpenderInfo {
  address: string;
  name?: string;
  isContract: boolean;
  isVerified?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RevocationRecommendation {
  approval: ApprovalData;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  estimatedGas?: string;
}

export interface ReportData {
  scanResult: ScanResult;
  recommendations: RevocationRecommendation[];
  generatedAt: string;
  version: string;
}

export interface ConfigOptions {
  rpcUrl: string;
  defaultBlockRange?: bigint;
  cacheEnabled?: boolean;
  cacheTtlMs?: number;
  batchSize?: number;
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  factors: string[];
  recommendations: string[];
}
