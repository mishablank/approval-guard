import { TokenApproval } from '../types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
}

export interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  cleanupInterval: number; // Interval for cleanup in milliseconds
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}

export interface ApprovalCacheData {
  approvals: TokenApproval[];
  walletAddress: string;
  chainId: number;
  blockNumber: bigint;
}

export const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  cleanupInterval: 60 * 1000, // 1 minute
};
