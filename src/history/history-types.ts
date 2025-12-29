import { Address } from 'viem';

export interface ApprovalEvent {
  transactionHash: string;
  blockNumber: bigint;
  timestamp: number;
  owner: Address;
  spender: Address;
  tokenAddress: Address;
  amount: bigint;
  eventType: 'approval' | 'revocation';
}

export interface ApprovalTimeline {
  tokenAddress: Address;
  spender: Address;
  events: ApprovalEvent[];
  firstApproval: number;
  lastModified: number;
  currentAmount: bigint;
  changeCount: number;
}

export interface WalletHistory {
  walletAddress: Address;
  timelines: ApprovalTimeline[];
  totalApprovals: number;
  totalRevocations: number;
  oldestApproval: number | null;
  newestApproval: number | null;
}

export interface HistoryQueryOptions {
  fromBlock?: bigint;
  toBlock?: bigint;
  tokenAddresses?: Address[];
  spenderAddresses?: Address[];
  includeRevocations?: boolean;
}

export interface TimelineAnalysis {
  averageApprovalAge: number;
  oldestActiveApproval: ApprovalTimeline | null;
  frequentlyModified: ApprovalTimeline[];
  neverModified: ApprovalTimeline[];
  recentActivity: ApprovalEvent[];
}
