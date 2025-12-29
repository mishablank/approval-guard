import type { Address } from 'viem';
import { ApprovalFetcher } from './services/approval-fetcher';
import { TokenMetadataService } from './services/token-metadata-service';
import { ApprovalCache } from './cache/approval-cache';
import { ValidationError } from './errors';
import { isValidAddress } from './utils/address';
import type { TokenApproval, ScanResult, ScanOptions } from './types';

export class ApprovalScanner {
  private fetcher: ApprovalFetcher;
  private metadataService: TokenMetadataService;
  private cache: ApprovalCache;

  constructor(options: ScanOptions = {}) {
    this.fetcher = new ApprovalFetcher({
      batchSize: options.batchSize,
      maxConcurrent: options.maxConcurrent,
    });
    this.metadataService = new TokenMetadataService();
    this.cache = new ApprovalCache({
      ttl: options.cacheTtl ?? 300000,
    });
  }

  async scan(walletAddress: string): Promise<ScanResult> {
    if (!isValidAddress(walletAddress)) {
      throw new ValidationError('Invalid wallet address', { walletAddress });
    }

    const address = walletAddress as Address;
    const startTime = Date.now();

    // Check cache first
    const cached = this.cache.get(address);
    if (cached) {
      return {
        walletAddress: address,
        approvals: cached,
        scanTimestamp: new Date(),
        totalApprovals: cached.length,
        fromCache: true,
      };
    }

    // Fetch approvals from blockchain
    const approvals = await this.fetcher.fetchActiveApprovals(address);

    // Enrich with token metadata
    const enrichedApprovals = await this.enrichApprovals(approvals);

    // Cache results
    this.cache.set(address, enrichedApprovals);

    const scanDuration = Date.now() - startTime;

    return {
      walletAddress: address,
      approvals: enrichedApprovals,
      scanTimestamp: new Date(),
      totalApprovals: enrichedApprovals.length,
      scanDurationMs: scanDuration,
      fromCache: false,
    };
  }

  private async enrichApprovals(approvals: TokenApproval[]): Promise<TokenApproval[]> {
    const enriched: TokenApproval[] = [];

    for (const approval of approvals) {
      try {
        const metadata = await this.metadataService.getTokenMetadata(approval.tokenAddress);
        enriched.push({
          ...approval,
          tokenName: metadata.name,
          tokenSymbol: metadata.symbol,
          tokenDecimals: metadata.decimals,
        });
      } catch {
        enriched.push(approval);
      }
    }

    return enriched;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }
}

export async function scanWalletApprovals(
  walletAddress: string,
  options?: ScanOptions
): Promise<ScanResult> {
  const scanner = new ApprovalScanner(options);
  return scanner.scan(walletAddress);
}
