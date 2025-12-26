import { createPublicClient, http, parseAbiItem, type Address, type Log } from 'viem';
import { mainnet } from 'viem/chains';
import { config } from './config';
import { ERC20_APPROVAL_EVENT } from './constants';
import { NetworkError } from './errors';
import { batchProcess } from './utils/batch-processor';
import type { ApprovalEvent, ScanOptions, ScanProgress } from './types';

interface CacheEntry {
  approvals: ApprovalEvent[];
  timestamp: number;
  blockNumber: bigint;
}

const approvalCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function createClient(rpcUrl?: string) {
  return createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl || config.rpcUrl),
  });
}

function getCacheKey(walletAddress: Address, fromBlock?: bigint): string {
  return `${walletAddress.toLowerCase()}-${fromBlock?.toString() || '0'}`;
}

function getCachedApprovals(walletAddress: Address, fromBlock?: bigint): ApprovalEvent[] | null {
  const key = getCacheKey(walletAddress, fromBlock);
  const entry = approvalCache.get(key);
  
  if (!entry) return null;
  
  const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    approvalCache.delete(key);
    return null;
  }
  
  return entry.approvals;
}

function setCachedApprovals(
  walletAddress: Address,
  approvals: ApprovalEvent[],
  blockNumber: bigint,
  fromBlock?: bigint
): void {
  const key = getCacheKey(walletAddress, fromBlock);
  approvalCache.set(key, {
    approvals,
    timestamp: Date.now(),
    blockNumber,
  });
}

export function clearApprovalCache(): void {
  approvalCache.clear();
}

function parseApprovalLog(log: Log): ApprovalEvent | null {
  try {
    const owner = log.topics[1] as Address;
    const spender = log.topics[2] as Address;
    const value = BigInt(log.data);
    
    if (!owner || !spender) return null;
    
    return {
      tokenAddress: log.address as Address,
      owner: `0x${owner.slice(26)}` as Address,
      spender: `0x${spender.slice(26)}` as Address,
      value,
      blockNumber: log.blockNumber || 0n,
      transactionHash: log.transactionHash || '0x',
    };
  } catch {
    return null;
  }
}

async function fetchLogsWithRetry(
  client: ReturnType<typeof createClient>,
  filter: {
    address?: Address;
    event: ReturnType<typeof parseAbiItem>;
    args: { owner: Address };
    fromBlock: bigint;
    toBlock: bigint;
  },
  maxRetries = 3
): Promise<Log[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const logs = await client.getLogs({
        event: filter.event as any,
        args: filter.args,
        fromBlock: filter.fromBlock,
        toBlock: filter.toBlock,
      });
      return logs;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new NetworkError(
    `Failed to fetch logs after ${maxRetries} attempts: ${lastError?.message}`
  );
}

export async function scanApprovals(
  walletAddress: Address,
  options: ScanOptions = {}
): Promise<ApprovalEvent[]> {
  const { fromBlock, toBlock, useCache = true, onProgress } = options;
  
  // Check cache first
  if (useCache) {
    const cached = getCachedApprovals(walletAddress, fromBlock);
    if (cached) {
      onProgress?.({
        phase: 'complete',
        current: cached.length,
        total: cached.length,
        message: 'Loaded from cache',
      });
      return cached;
    }
  }
  
  const client = createClient();
  
  onProgress?.({
    phase: 'scanning',
    current: 0,
    total: 0,
    message: 'Fetching approval events...',
  });
  
  const currentBlock = await client.getBlockNumber();
  const startBlock = fromBlock || currentBlock - BigInt(config.scanBlockRange);
  const endBlock = toBlock || currentBlock;
  
  const approvalEvent = parseAbiItem(ERC20_APPROVAL_EVENT);
  
  const logs = await fetchLogsWithRetry(client, {
    event: approvalEvent,
    args: { owner: walletAddress },
    fromBlock: startBlock,
    toBlock: endBlock,
  });
  
  onProgress?.({
    phase: 'processing',
    current: 0,
    total: logs.length,
    message: `Processing ${logs.length} approval events...`,
  });
  
  // Process logs in batches
  const parsedApprovals: ApprovalEvent[] = [];
  
  await batchProcess(
    logs,
    async (log) => {
      const approval = parseApprovalLog(log);
      if (approval) {
        parsedApprovals.push(approval);
      }
    },
    {
      batchSize: 100,
      onBatchComplete: (completed, total) => {
        onProgress?.({
          phase: 'processing',
          current: completed,
          total,
          message: `Processed ${completed}/${total} events`,
        });
      },
    }
  );
  
  // Deduplicate by keeping latest approval per token-spender pair
  const latestApprovals = deduplicateApprovals(parsedApprovals);
  
  // Filter out zero approvals (revocations)
  const activeApprovals = latestApprovals.filter(a => a.value > 0n);
  
  // Cache results
  if (useCache) {
    setCachedApprovals(walletAddress, activeApprovals, currentBlock, fromBlock);
  }
  
  onProgress?.({
    phase: 'complete',
    current: activeApprovals.length,
    total: activeApprovals.length,
    message: `Found ${activeApprovals.length} active approvals`,
  });
  
  return activeApprovals;
}

function deduplicateApprovals(approvals: ApprovalEvent[]): ApprovalEvent[] {
  const approvalMap = new Map<string, ApprovalEvent>();
  
  // Sort by block number to ensure we keep the latest
  const sorted = [...approvals].sort((a, b) => 
    Number(a.blockNumber - b.blockNumber)
  );
  
  for (const approval of sorted) {
    const key = `${approval.tokenAddress.toLowerCase()}-${approval.spender.toLowerCase()}`;
    approvalMap.set(key, approval);
  }
  
  return Array.from(approvalMap.values());
}

export async function getApprovalDetails(
  client: ReturnType<typeof createClient>,
  tokenAddress: Address,
  ownerAddress: Address,
  spenderAddress: Address
): Promise<bigint> {
  try {
    const allowance = await client.readContract({
      address: tokenAddress,
      abi: [{
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      }],
      functionName: 'allowance',
      args: [ownerAddress, spenderAddress],
    });
    
    return allowance;
  } catch {
    return 0n;
  }
}
