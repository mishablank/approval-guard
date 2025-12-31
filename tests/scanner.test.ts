import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovalScanner, createScanner, scanApprovals } from '../src/scanner.js';
import { ValidationError } from '../src/errors/validation-error.js';

// Mock viem
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getBlockNumber: vi.fn().mockResolvedValue(18000000n),
      getLogs: vi.fn().mockResolvedValue([]),
      readContract: vi.fn().mockResolvedValue('Test Token'),
    })),
  };
});

describe('ApprovalScanner', () => {
  let scanner: ApprovalScanner;

  beforeEach(() => {
    scanner = new ApprovalScanner({
      cacheEnabled: false,
      historyEnabled: false,
    });
  });

  describe('constructor', () => {
    it('should create scanner with default options', () => {
      const defaultScanner = new ApprovalScanner();
      expect(defaultScanner).toBeInstanceOf(ApprovalScanner);
    });

    it('should create scanner with custom options', () => {
      const customScanner = new ApprovalScanner({
        rpcUrl: 'https://custom-rpc.example.com',
        cacheEnabled: true,
        historyEnabled: true,
        batchSize: 50,
      });
      expect(customScanner).toBeInstanceOf(ApprovalScanner);
    });
  });

  describe('scan', () => {
    it('should throw ValidationError for invalid address', async () => {
      await expect(scanner.scan('invalid-address')).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for empty address', async () => {
      await expect(scanner.scan('')).rejects.toThrow(ValidationError);
    });

    it('should return scan result for valid address', async () => {
      const result = await scanner.scan('0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21');
      
      expect(result).toHaveProperty('walletAddress');
      expect(result).toHaveProperty('approvals');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('scanMetadata');
    });

    it('should normalize wallet address', async () => {
      const result = await scanner.scan('0x742D35CC6634C0532925A3B844BC9E7595F5BE21');
      expect(result.walletAddress).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21'.toLowerCase());
    });

    it('should include scan metadata', async () => {
      const result = await scanner.scan('0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21');
      
      expect(result.scanMetadata).toHaveProperty('scanTime');
      expect(result.scanMetadata).toHaveProperty('durationMs');
      expect(result.scanMetadata).toHaveProperty('fromCache');
      expect(result.scanMetadata.fromCache).toBe(false);
    });

    it('should include summary statistics', async () => {
      const result = await scanner.scan('0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21');
      
      expect(result.summary).toHaveProperty('totalApprovals');
      expect(result.summary).toHaveProperty('unlimitedApprovals');
      expect(result.summary).toHaveProperty('highRiskApprovals');
      expect(result.summary).toHaveProperty('mediumRiskApprovals');
      expect(result.summary).toHaveProperty('lowRiskApprovals');
      expect(result.summary).toHaveProperty('averageRiskScore');
    });
  });

  describe('clearCache', () => {
    it('should not throw when cache is disabled', () => {
      expect(() => scanner.clearCache()).not.toThrow();
    });

    it('should clear cache when enabled', () => {
      const cachedScanner = new ApprovalScanner({ cacheEnabled: true });
      expect(() => cachedScanner.clearCache()).not.toThrow();
    });
  });

  describe('getHistory', () => {
    it('should return empty history when history tracking is disabled', () => {
      const history = scanner.getHistory();
      expect(history.entries).toEqual([]);
      expect(history.statistics.totalApprovals).toBe(0);
    });
  });
});

describe('createScanner', () => {
  it('should create scanner instance', () => {
    const scanner = createScanner();
    expect(scanner).toBeInstanceOf(ApprovalScanner);
  });

  it('should create scanner with options', () => {
    const scanner = createScanner({ batchSize: 100 });
    expect(scanner).toBeInstanceOf(ApprovalScanner);
  });
});

describe('scanApprovals', () => {
  it('should scan approvals using legacy function', async () => {
    const result = await scanApprovals('0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21');
    expect(result).toHaveProperty('walletAddress');
    expect(result).toHaveProperty('approvals');
  });

  it('should throw for invalid address', async () => {
    await expect(scanApprovals('invalid')).rejects.toThrow(ValidationError);
  });
});
