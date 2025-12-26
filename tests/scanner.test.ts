import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { scanApprovals, clearApprovalCache, createClient } from '../src/scanner';
import type { Address } from 'viem';

// Mock viem
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getBlockNumber: vi.fn().mockResolvedValue(18000000n),
      getLogs: vi.fn().mockResolvedValue([]),
      readContract: vi.fn().mockResolvedValue(0n),
    })),
  };
});

describe('Scanner', () => {
  const testWallet: Address = '0x1234567890123456789012345678901234567890';
  
  beforeEach(() => {
    clearApprovalCache();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    clearApprovalCache();
  });
  
  describe('scanApprovals', () => {
    it('should return empty array when no approvals found', async () => {
      const approvals = await scanApprovals(testWallet);
      expect(approvals).toEqual([]);
    });
    
    it('should call progress callback with phases', async () => {
      const progressCalls: string[] = [];
      
      await scanApprovals(testWallet, {
        onProgress: (progress) => {
          progressCalls.push(progress.phase);
        },
      });
      
      expect(progressCalls).toContain('scanning');
      expect(progressCalls).toContain('processing');
      expect(progressCalls).toContain('complete');
    });
    
    it('should use cache on subsequent calls', async () => {
      // First call
      await scanApprovals(testWallet, { useCache: true });
      
      // Second call should use cache
      const progressCalls: string[] = [];
      await scanApprovals(testWallet, {
        useCache: true,
        onProgress: (progress) => {
          progressCalls.push(progress.message);
        },
      });
      
      expect(progressCalls.some(msg => msg.includes('cache'))).toBe(true);
    });
    
    it('should skip cache when useCache is false', async () => {
      // First call to populate cache
      await scanApprovals(testWallet, { useCache: true });
      
      // Second call without cache
      const progressCalls: string[] = [];
      await scanApprovals(testWallet, {
        useCache: false,
        onProgress: (progress) => {
          progressCalls.push(progress.message);
        },
      });
      
      expect(progressCalls.some(msg => msg.includes('Fetching'))).toBe(true);
    });
  });
  
  describe('createClient', () => {
    it('should create a public client', () => {
      const client = createClient();
      expect(client).toBeDefined();
    });
    
    it('should accept custom RPC URL', () => {
      const client = createClient('https://custom-rpc.example.com');
      expect(client).toBeDefined();
    });
  });
  
  describe('clearApprovalCache', () => {
    it('should clear the cache', async () => {
      // Populate cache
      await scanApprovals(testWallet, { useCache: true });
      
      // Clear cache
      clearApprovalCache();
      
      // Next call should not use cache
      const progressCalls: string[] = [];
      await scanApprovals(testWallet, {
        useCache: true,
        onProgress: (progress) => {
          progressCalls.push(progress.message);
        },
      });
      
      expect(progressCalls.some(msg => msg.includes('Fetching'))).toBe(true);
    });
  });
});
