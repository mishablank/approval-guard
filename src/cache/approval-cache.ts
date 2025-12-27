import { TokenApproval } from '../types';
import {
  CacheEntry,
  CacheOptions,
  CacheStats,
  ApprovalCacheData,
  DEFAULT_CACHE_OPTIONS,
} from './types';

export class ApprovalCache {
  private cache: Map<string, CacheEntry<ApprovalCacheData>>;
  private options: CacheOptions;
  private hits: number = 0;
  private misses: number = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: Partial<CacheOptions> = {}) {
    this.cache = new Map();
    this.options = { ...DEFAULT_CACHE_OPTIONS, ...options };
    this.startCleanupTimer();
  }

  private generateKey(walletAddress: string, chainId: number): string {
    return `${walletAddress.toLowerCase()}-${chainId}`;
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  private enforceMaxSize(): void {
    if (this.cache.size <= this.options.maxSize) {
      return;
    }

    // Remove oldest entries first
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, this.cache.size - this.options.maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  get(
    walletAddress: string,
    chainId: number
  ): ApprovalCacheData | null {
    const key = this.generateKey(walletAddress, chainId);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (entry.expiresAt <= now) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.hits++;
    this.hits++;
    return entry.data;
  }

  set(
    walletAddress: string,
    chainId: number,
    approvals: TokenApproval[],
    blockNumber: bigint
  ): void {
    const key = this.generateKey(walletAddress, chainId);
    const now = Date.now();

    const entry: CacheEntry<ApprovalCacheData> = {
      data: {
        approvals,
        walletAddress: walletAddress.toLowerCase(),
        chainId,
        blockNumber,
      },
      timestamp: now,
      expiresAt: now + this.options.ttl,
      hits: 0,
    };

    this.cache.set(key, entry);
    this.enforceMaxSize();
  }

  invalidate(walletAddress: string, chainId: number): boolean {
    const key = this.generateKey(walletAddress, chainId);
    return this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map((e) => e.timestamp);

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? this.hits / (this.hits + this.misses)
        : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  has(walletAddress: string, chainId: number): boolean {
    const key = this.generateKey(walletAddress, chainId);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}
