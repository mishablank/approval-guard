import { Address, PublicClient, parseAbiItem, Log } from 'viem';
import {
  ApprovalEvent,
  ApprovalTimeline,
  WalletHistory,
  HistoryQueryOptions,
  TimelineAnalysis,
} from './history-types';
import { NetworkError } from '../errors';

const APPROVAL_EVENT_ABI = parseAbiItem(
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
);

const BLOCKS_PER_QUERY = 10000n;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export class HistoryTracker {
  private client: PublicClient;

  constructor(client: PublicClient) {
    this.client = client;
  }

  async getApprovalHistory(
    walletAddress: Address,
    options: HistoryQueryOptions = {}
  ): Promise<WalletHistory> {
    const events = await this.fetchApprovalEvents(walletAddress, options);
    const timelines = this.buildTimelines(walletAddress, events);

    const approvalEvents = events.filter((e) => e.eventType === 'approval');
    const revocationEvents = events.filter((e) => e.eventType === 'revocation');

    const timestamps = approvalEvents.map((e) => e.timestamp);

    return {
      walletAddress,
      timelines,
      totalApprovals: approvalEvents.length,
      totalRevocations: revocationEvents.length,
      oldestApproval: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestApproval: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  private async fetchApprovalEvents(
    walletAddress: Address,
    options: HistoryQueryOptions
  ): Promise<ApprovalEvent[]> {
    const currentBlock = await this.client.getBlockNumber();
    const fromBlock = options.fromBlock ?? currentBlock - 100000n;
    const toBlock = options.toBlock ?? currentBlock;

    const allEvents: ApprovalEvent[] = [];

    for (let start = fromBlock; start <= toBlock; start += BLOCKS_PER_QUERY) {
      const end = start + BLOCKS_PER_QUERY - 1n > toBlock ? toBlock : start + BLOCKS_PER_QUERY - 1n;

      try {
        const logs = await this.client.getLogs({
          event: APPROVAL_EVENT_ABI,
          args: {
            owner: walletAddress,
          },
          fromBlock: start,
          toBlock: end,
        });

        const events = await this.processLogs(logs, options);
        allEvents.push(...events);
      } catch (error) {
        throw new NetworkError(
          `Failed to fetch approval events: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return allEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  private async processLogs(
    logs: Log[],
    options: HistoryQueryOptions
  ): Promise<ApprovalEvent[]> {
    const events: ApprovalEvent[] = [];

    for (const log of logs) {
      if (!log.blockNumber || !log.transactionHash || !log.address) continue;

      const args = log.args as { owner: Address; spender: Address; value: bigint };
      if (!args.owner || !args.spender || args.value === undefined) continue;

      // Apply filters
      if (
        options.tokenAddresses &&
        !options.tokenAddresses.includes(log.address as Address)
      ) {
        continue;
      }

      if (
        options.spenderAddresses &&
        !options.spenderAddresses.includes(args.spender)
      ) {
        continue;
      }

      const isRevocation = args.value === 0n;
      if (isRevocation && !options.includeRevocations) {
        continue;
      }

      const block = await this.client.getBlock({ blockNumber: log.blockNumber });

      events.push({
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp: Number(block.timestamp) * 1000,
        owner: args.owner,
        spender: args.spender,
        tokenAddress: log.address as Address,
        amount: args.value,
        eventType: isRevocation ? 'revocation' : 'approval',
      });
    }

    return events;
  }

  private buildTimelines(
    _walletAddress: Address,
    events: ApprovalEvent[]
  ): ApprovalTimeline[] {
    const timelineMap = new Map<string, ApprovalTimeline>();

    for (const event of events) {
      const key = `${event.tokenAddress}-${event.spender}`;

      if (!timelineMap.has(key)) {
        timelineMap.set(key, {
          tokenAddress: event.tokenAddress,
          spender: event.spender,
          events: [],
          firstApproval: event.timestamp,
          lastModified: event.timestamp,
          currentAmount: event.amount,
          changeCount: 0,
        });
      }

      const timeline = timelineMap.get(key)!;
      timeline.events.push(event);
      timeline.lastModified = event.timestamp;
      timeline.currentAmount = event.amount;
      timeline.changeCount++;
    }

    return Array.from(timelineMap.values());
  }

  analyzeTimelines(history: WalletHistory): TimelineAnalysis {
    const now = Date.now();
    const activeTimelines = history.timelines.filter((t) => t.currentAmount > 0n);

    // Calculate average approval age
    const ages = activeTimelines.map((t) => now - t.firstApproval);
    const averageApprovalAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    // Find oldest active approval
    const oldestActiveApproval = activeTimelines.reduce<ApprovalTimeline | null>(
      (oldest, current) => {
        if (!oldest || current.firstApproval < oldest.firstApproval) {
          return current;
        }
        return oldest;
      },
      null
    );

    // Find frequently modified (more than 3 changes)
    const frequentlyModified = activeTimelines.filter((t) => t.changeCount > 3);

    // Find never modified (only initial approval)
    const neverModified = activeTimelines.filter((t) => t.changeCount === 1);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = now - THIRTY_DAYS_MS;
    const recentActivity = history.timelines
      .flatMap((t) => t.events)
      .filter((e) => e.timestamp > thirtyDaysAgo)
      .sort((a, b) => b.timestamp - a.timestamp);

    return {
      averageApprovalAge,
      oldestActiveApproval,
      frequentlyModified,
      neverModified,
      recentActivity,
    };
  }
}
