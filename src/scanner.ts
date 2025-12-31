import { createPublicClient, http, type Address, parseAbiItem } from 'viem';
import { mainnet } from 'viem/chains';
import { config } from './config.js';
import { ApprovalData, ScanOptions, ScanResult } from './types.js';
import { ApprovalCache } from './cache/approval-cache.js';
import { BatchProcessor } from './utils/batch-processor.js';
import { TokenMetadataService } from './services/token-metadata-service.js';
import { RiskCalculator } from './risk/risk-calculator.js';
import { HistoryTracker } from './history/history-tracker.js';
import { NetworkError } from './errors/network-error.js';
import { ValidationError } from './errors/validation-error.js';
import { isValidAddress, normalizeAddress } from './utils/address.js';
import { ERC20_APPROVAL_TOPIC, MAX_UINT256, DEFAULT_BATCH_SIZE, DEFAULT_BLOCK_RANGE } from './constants.js';

const approvalEvent = parseAbiItem(
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
);

export interface ScannerOptions {
  rpcUrl?: string;
  cacheEnabled?: boolean;
  historyEnabled?: boolean;
  batchSize?: number;
  blockRange?: bigint;
}

export class ApprovalScanner {
  private client;
  private cache: ApprovalCache | null;
  private metadataService: TokenMetadataService;
  private riskCalculator: RiskCalculator;
  private historyTracker: HistoryTracker | null;
  private batchProcessor: BatchProcessor<Address, ApprovalData[]>;
  private batchSize: number;
  private blockRange: bigint;

  constructor(options: ScannerOptions = {}) {
    const rpcUrl = options.rpcUrl || config.rpcUrl;
    
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });

    this.cache = options.cacheEnabled !== false ? new ApprovalCache() : null;
    this.metadataService = new TokenMetadataService(this.client);
    this.riskCalculator = new RiskCalculator();
    this.historyTracker = options.historyEnabled !== false ? new HistoryTracker() : null;
    this.batchSize = options.batchSize || DEFAULT_BATCH_SIZE;
    this.blockRange = options.blockRange || DEFAULT_BLOCK_RANGE;

    this.batchProcessor = new BatchProcessor<Address, ApprovalData[]>(
      async (tokens) => this.processTokenBatch(tokens),
      { batchSize: this.batchSize }
    );
  }

  async scan(walletAddress: string, options: ScanOptions = {}): Promise<ScanResult> {
    if (!isValidAddress(walletAddress)) {
      throw new ValidationError(`Invalid wallet address: ${walletAddress}`);
    }

    const normalizedAddress = normalizeAddress(walletAddress);
    const startTime = Date.now();

    // Check cache first
    if (this.cache && !options.forceRefresh) {
      const cached = this.cache.get(normalizedAddress);
      if (cached) {
        return this.buildScanResult(normalizedAddress, cached, startTime, true);
      }
    }

    try {
      const approvals = await this.fetchApprovals(normalizedAddress, options);
      const enrichedApprovals = await this.enrichApprovals(approvals);

      // Update cache
      if (this.cache) {
        this.cache.set(normalizedAddress, enrichedApprovals);
      }

      // Track in history
      if (this.historyTracker) {
        for (const approval of enrichedApprovals) {
          this.historyTracker.recordApproval(approval);
        }
      }

      return this.buildScanResult(normalizedAddress, enrichedApprovals, startTime, false);
    } catch (error) {
      if (error instanceof Error) {
        throw new NetworkError(`Failed to scan approvals: ${error.message}`);
      }
      throw error;
    }
  }

  private async fetchApprovals(
    walletAddress: Address,
    options: ScanOptions
  ): Promise<ApprovalData[]> {
    const currentBlock = await this.client.getBlockNumber();
    const fromBlock = options.fromBlock || currentBlock - this.blockRange;

    const logs = await this.client.getLogs({
      event: approvalEvent,
      args: {
        owner: walletAddress,
      },
      fromBlock,
      toBlock: currentBlock,
    });

    const approvalMap = new Map<string, ApprovalData>();

    for (const log of logs) {
      const { spender, value } = log.args as { spender: Address; value: bigint };
      const tokenAddress = log.address;
      const key = `${tokenAddress}-${spender}`;

      // Keep only the latest approval for each token-spender pair
      const existing = approvalMap.get(key);
      if (!existing || log.blockNumber > existing.blockNumber) {
        approvalMap.set(key, {
          tokenAddress: normalizeAddress(tokenAddress),
          spenderAddress: normalizeAddress(spender),
          ownerAddress: walletAddress,
          allowance: value.toString(),
          isUnlimited: value === MAX_UINT256,
          blockNumber: Number(log.blockNumber),
          transactionHash: log.transactionHash,
          riskScore: 0,
          riskFactors: [],
        });
      }
    }

    // Filter out zero allowances (revoked approvals)
    return Array.from(approvalMap.values()).filter(
      (approval) => BigInt(approval.allowance) > 0n
    );
  }

  private async enrichApprovals(approvals: ApprovalData[]): Promise<ApprovalData[]> {
    const tokenAddresses = [...new Set(approvals.map((a) => a.tokenAddress))];
    
    // Fetch metadata in batches
    const metadataMap = new Map<string, { name: string; symbol: string; decimals: number }>();
    
    for (const tokenAddress of tokenAddresses) {
      try {
        const metadata = await this.metadataService.getTokenMetadata(tokenAddress as Address);
        metadataMap.set(tokenAddress, metadata);
      } catch {
        // Use defaults if metadata fetch fails
        metadataMap.set(tokenAddress, { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 });
      }
    }

    return approvals.map((approval) => {
      const metadata = metadataMap.get(approval.tokenAddress);
      const riskResult = this.riskCalculator.calculate(approval);

      return {
        ...approval,
        tokenName: metadata?.name,
        tokenSymbol: metadata?.symbol,
        tokenDecimals: metadata?.decimals,
        riskScore: riskResult.score,
        riskFactors: riskResult.factors,
      };
    });
  }

  private async processTokenBatch(tokens: Address[]): Promise<ApprovalData[][]> {
    // Placeholder for batch processing logic
    return tokens.map(() => []);
  }

  private buildScanResult(
    walletAddress: Address,
    approvals: ApprovalData[],
    startTime: number,
    fromCache: boolean
  ): ScanResult {
    const sortedApprovals = [...approvals].sort((a, b) => b.riskScore - a.riskScore);
    const totalRiskScore = approvals.reduce((sum, a) => sum + a.riskScore, 0);
    const averageRiskScore = approvals.length > 0 ? totalRiskScore / approvals.length : 0;

    return {
      walletAddress,
      approvals: sortedApprovals,
      summary: {
        totalApprovals: approvals.length,
        unlimitedApprovals: approvals.filter((a) => a.isUnlimited).length,
        highRiskApprovals: approvals.filter((a) => a.riskScore >= 70).length,
        mediumRiskApprovals: approvals.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length,
        lowRiskApprovals: approvals.filter((a) => a.riskScore < 40).length,
        averageRiskScore: Math.round(averageRiskScore),
      },
      scanMetadata: {
        scanTime: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        fromCache,
        rpcUrl: config.rpcUrl,
      },
    };
  }

  clearCache(): void {
    this.cache?.clear();
  }

  getHistory(walletAddress?: string): ReturnType<HistoryTracker['getHistory']> {
    if (!this.historyTracker) {
      return { entries: [], statistics: { totalApprovals: 0, totalRevocations: 0, uniqueTokens: 0, uniqueSpenders: 0 } };
    }
    return this.historyTracker.getHistory(walletAddress as Address | undefined);
  }
}

// Factory function for creating scanner instances
export function createScanner(options?: ScannerOptions): ApprovalScanner {
  return new ApprovalScanner(options);
}

// Legacy default export for backwards compatibility
export async function scanApprovals(
  walletAddress: string,
  options?: ScanOptions & ScannerOptions
): Promise<ScanResult> {
  const scanner = createScanner(options);
  return scanner.scan(walletAddress, options);
}
