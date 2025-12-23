import { Address, PublicClient } from 'viem';
import { TokenApproval, ScanResult } from '../types';
import { isValidAddress, normalizeAddress } from '../utils/address';

export interface ApprovalServiceConfig {
  client: PublicClient;
  includeZeroApprovals?: boolean;
}

export class ApprovalService {
  private client: PublicClient;
  private includeZeroApprovals: boolean;

  constructor(config: ApprovalServiceConfig) {
    this.client = config.client;
    this.includeZeroApprovals = config.includeZeroApprovals ?? false;
  }

  async getApprovalsForWallet(walletAddress: string): Promise<ScanResult> {
    if (!isValidAddress(walletAddress)) {
      throw new Error(`Invalid wallet address: ${walletAddress}`);
    }

    const normalizedAddress = normalizeAddress(walletAddress);
    const startTime = Date.now();

    try {
      const approvals = await this.fetchApprovals(normalizedAddress as Address);
      const filteredApprovals = this.includeZeroApprovals
        ? approvals
        : approvals.filter((a) => a.allowance !== '0');

      return {
        walletAddress: normalizedAddress,
        approvals: filteredApprovals,
        scanTimestamp: new Date().toISOString(),
        totalApprovals: filteredApprovals.length,
        scanDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch approvals: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async fetchApprovals(walletAddress: Address): Promise<TokenApproval[]> {
    // This will be implemented by the scanner module
    // For now, return empty array as placeholder
    return [];
  }

  async getApprovalDetails(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<TokenApproval | null> {
    if (!isValidAddress(tokenAddress) || !isValidAddress(ownerAddress) || !isValidAddress(spenderAddress)) {
      throw new Error('Invalid address provided');
    }

    // Placeholder for detailed approval lookup
    return null;
  }

  async batchGetApprovals(
    walletAddresses: string[]
  ): Promise<Map<string, ScanResult>> {
    const results = new Map<string, ScanResult>();

    for (const address of walletAddresses) {
      try {
        const result = await this.getApprovalsForWallet(address);
        results.set(normalizeAddress(address), result);
      } catch (error) {
        console.error(`Failed to scan ${address}:`, error);
      }
    }

    return results;
  }
}
