import type { PublicClient, Address } from 'viem';
import type { ApprovalInfo } from '../types';
import { ApprovalFetcher } from './approval-fetcher';
import { TokenMetadataService } from './token-metadata-service';
import { ApprovalGuardError } from '../errors';

export interface ApprovalServiceOptions {
  includeZeroAllowances?: boolean;
  enrichMetadata?: boolean;
}

export class ApprovalService {
  private publicClient: PublicClient;
  private approvalFetcher: ApprovalFetcher;
  private tokenMetadataService: TokenMetadataService;

  constructor(
    publicClient: PublicClient,
    approvalFetcher?: ApprovalFetcher,
    tokenMetadataService?: TokenMetadataService
  ) {
    this.publicClient = publicClient;
    this.approvalFetcher = approvalFetcher || new ApprovalFetcher(publicClient);
    this.tokenMetadataService = tokenMetadataService || new TokenMetadataService(publicClient);
  }

  async getApprovals(
    walletAddress: Address,
    options: ApprovalServiceOptions = {}
  ): Promise<ApprovalInfo[]> {
    const { includeZeroAllowances = false, enrichMetadata = true } = options;

    try {
      let approvals = await this.approvalFetcher.fetchApprovals(walletAddress);

      if (!includeZeroAllowances) {
        approvals = approvals.filter(a => BigInt(a.allowance) > 0n);
      }

      if (enrichMetadata) {
        approvals = await this.enrichApprovalsWithMetadata(approvals);
      }

      return approvals;
    } catch (error) {
      throw new ApprovalGuardError(
        `Failed to get approvals for ${walletAddress}`,
        'APPROVAL_FETCH_ERROR',
        error
      );
    }
  }

  async getApprovalsBySpender(
    walletAddress: Address,
    spenderAddress: Address
  ): Promise<ApprovalInfo[]> {
    const allApprovals = await this.getApprovals(walletAddress);
    return allApprovals.filter(
      a => a.spender.toLowerCase() === spenderAddress.toLowerCase()
    );
  }

  async getApprovalsByToken(
    walletAddress: Address,
    tokenAddress: Address
  ): Promise<ApprovalInfo[]> {
    const allApprovals = await this.getApprovals(walletAddress);
    return allApprovals.filter(
      a => a.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    );
  }

  async getUnlimitedApprovals(walletAddress: Address): Promise<ApprovalInfo[]> {
    const approvals = await this.getApprovals(walletAddress);
    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const unlimitedThreshold = maxUint256 / 2n;

    return approvals.filter(a => BigInt(a.allowance) >= unlimitedThreshold);
  }

  async getApprovalCount(walletAddress: Address): Promise<number> {
    const approvals = await this.getApprovals(walletAddress);
    return approvals.length;
  }

  private async enrichApprovalsWithMetadata(
    approvals: ApprovalInfo[]
  ): Promise<ApprovalInfo[]> {
    const enrichedApprovals: ApprovalInfo[] = [];

    for (const approval of approvals) {
      try {
        const metadata = await this.tokenMetadataService.getTokenMetadata(
          approval.tokenAddress as Address
        );

        enrichedApprovals.push({
          ...approval,
          tokenSymbol: metadata.symbol || approval.tokenSymbol,
          tokenDecimals: metadata.decimals ?? approval.tokenDecimals,
        });
      } catch {
        // Keep original data if metadata fetch fails
        enrichedApprovals.push(approval);
      }
    }

    return enrichedApprovals;
  }
}
