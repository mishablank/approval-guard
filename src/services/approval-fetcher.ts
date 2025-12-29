import { createPublicClient, http, type Address, parseAbiItem, type Log } from 'viem';
import { mainnet } from 'viem/chains';
import { config } from '../config';
import { NetworkError } from '../errors';
import { BatchProcessor } from '../utils/batch-processor';
import type { TokenApproval } from '../types';

const APPROVAL_EVENT = parseAbiItem(
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
);

const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface ApprovalEvent {
  tokenAddress: Address;
  spender: Address;
  blockNumber: bigint;
  transactionHash: string;
}

export interface ApprovalFetcherOptions {
  batchSize?: number;
  maxConcurrent?: number;
  fromBlock?: bigint;
  toBlock?: bigint | 'latest';
}

export class ApprovalFetcher {
  private client;
  private batchProcessor: BatchProcessor<ApprovalEvent, TokenApproval | null>;

  constructor(private options: ApprovalFetcherOptions = {}) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(config.rpcUrl),
    });

    this.batchProcessor = new BatchProcessor<ApprovalEvent, TokenApproval | null>(
      this.fetchApprovalDetails.bind(this),
      {
        batchSize: options.batchSize ?? 10,
        maxConcurrent: options.maxConcurrent ?? 3,
      }
    );
  }

  async fetchApprovalEvents(walletAddress: Address): Promise<ApprovalEvent[]> {
    try {
      const logs = await this.client.getLogs({
        event: APPROVAL_EVENT,
        args: {
          owner: walletAddress,
        },
        fromBlock: this.options.fromBlock ?? 0n,
        toBlock: this.options.toBlock ?? 'latest',
      });

      return this.parseApprovalLogs(logs);
    } catch (error) {
      throw new NetworkError(
        `Failed to fetch approval events: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { walletAddress }
      );
    }
  }

  private parseApprovalLogs(logs: Log[]): ApprovalEvent[] {
    const approvalMap = new Map<string, ApprovalEvent>();

    for (const log of logs) {
      const spender = log.topics[2];
      if (!spender || !log.address || !log.blockNumber) continue;

      const spenderAddress = `0x${spender.slice(26)}` as Address;
      const key = `${log.address.toLowerCase()}-${spenderAddress.toLowerCase()}`;

      const existing = approvalMap.get(key);
      if (!existing || log.blockNumber > existing.blockNumber) {
        approvalMap.set(key, {
          tokenAddress: log.address as Address,
          spender: spenderAddress,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash ?? '',
        });
      }
    }

    return Array.from(approvalMap.values());
  }

  private async fetchApprovalDetails(
    event: ApprovalEvent,
    walletAddress: Address
  ): Promise<TokenApproval | null> {
    try {
      const allowance = await this.client.readContract({
        address: event.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [walletAddress, event.spender],
      });

      if (allowance === 0n) {
        return null;
      }

      const block = await this.client.getBlock({
        blockNumber: event.blockNumber,
      });

      return {
        tokenAddress: event.tokenAddress,
        tokenName: '',
        tokenSymbol: '',
        spender: event.spender,
        spenderName: undefined,
        allowance: allowance.toString(),
        isUnlimited: allowance >= BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') / 2n,
        lastUpdated: new Date(Number(block.timestamp) * 1000),
        transactionHash: event.transactionHash,
      };
    } catch (error) {
      console.warn(`Failed to fetch details for ${event.tokenAddress}: ${error}`);
      return null;
    }
  }

  async fetchActiveApprovals(walletAddress: Address): Promise<TokenApproval[]> {
    const events = await this.fetchApprovalEvents(walletAddress);
    
    const results = await this.batchProcessor.processAll(
      events,
      walletAddress
    );

    return results.filter((r): r is TokenApproval => r !== null);
  }

  async getCurrentAllowance(
    tokenAddress: Address,
    ownerAddress: Address,
    spenderAddress: Address
  ): Promise<bigint> {
    try {
      return await this.client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [ownerAddress, spenderAddress],
      });
    } catch (error) {
      throw new NetworkError(
        `Failed to fetch allowance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { tokenAddress, ownerAddress, spenderAddress }
      );
    }
  }
}
