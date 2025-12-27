import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TokenMetadataService } from '../src/services/token-metadata-service.js';
import type { Address } from 'viem';

describe('TokenMetadataService', () => {
  let service: TokenMetadataService;

  beforeEach(() => {
    service = new TokenMetadataService();
    service.clearCache();
  });

  describe('formatTokenAmount', () => {
    it('should format amount with 18 decimals correctly', () => {
      const amount = BigInt('1000000000000000000'); // 1 token with 18 decimals
      const result = service.formatTokenAmount(amount, 18);
      expect(result).toBe('1');
    });

    it('should format amount with 6 decimals correctly', () => {
      const amount = BigInt('1500000'); // 1.5 USDC
      const result = service.formatTokenAmount(amount, 6);
      expect(result).toBe('1.5');
    });

    it('should format small amounts correctly', () => {
      const amount = BigInt('100000000000000'); // 0.0001 ETH
      const result = service.formatTokenAmount(amount, 18);
      expect(result).toBe('0.0001');
    });

    it('should handle zero amount', () => {
      const result = service.formatTokenAmount(BigInt(0), 18);
      expect(result).toBe('0');
    });

    it('should handle large amounts', () => {
      const amount = BigInt('1000000000000000000000000'); // 1 million tokens
      const result = service.formatTokenAmount(amount, 18);
      expect(result).toBe('1000000');
    });
  });

  describe('isKnownToken', () => {
    it('should return true for USDT', () => {
      const usdt = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address;
      expect(service.isKnownToken(usdt)).toBe(true);
    });

    it('should return true for USDC', () => {
      const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address;
      expect(service.isKnownToken(usdc)).toBe(true);
    });

    it('should return false for unknown token', () => {
      const unknown = '0x1234567890123456789012345678901234567890' as Address;
      expect(service.isKnownToken(unknown)).toBe(false);
    });
  });

  describe('getTokenMetadata', () => {
    it('should return cached metadata for known tokens', async () => {
      const usdt = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address;
      const metadata = await service.getTokenMetadata(usdt);
      
      expect(metadata.name).toBe('Tether USD');
      expect(metadata.symbol).toBe('USDT');
      expect(metadata.decimals).toBe(6);
      expect(metadata.verified).toBe(true);
    });

    it('should return WETH metadata', async () => {
      const weth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address;
      const metadata = await service.getTokenMetadata(weth);
      
      expect(metadata.name).toBe('Wrapped Ether');
      expect(metadata.symbol).toBe('WETH');
      expect(metadata.decimals).toBe(18);
    });
  });

  describe('getMultipleTokenMetadata', () => {
    it('should fetch metadata for multiple known tokens', async () => {
      const tokens = [
        '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
      ];
      
      const results = await service.getMultipleTokenMetadata(tokens);
      
      expect(results.size).toBe(2);
      expect(results.get(tokens[0])?.symbol).toBe('USDT');
      expect(results.get(tokens[1])?.symbol).toBe('USDC');
    });

    it('should handle duplicate addresses', async () => {
      const tokens = [
        '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
        '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address,
      ];
      
      const results = await service.getMultipleTokenMetadata(tokens);
      
      expect(results.size).toBe(1);
    });
  });

  describe('clearCache', () => {
    it('should clear the metadata cache', async () => {
      const usdt = '0xdAC17F958D2ee523a2206206994597C13D831ec7' as Address;
      
      // Fetch to populate cache
      await service.getTokenMetadata(usdt);
      
      // Clear cache
      service.clearCache();
      
      // This should work without errors after clearing
      const metadata = await service.getTokenMetadata(usdt);
      expect(metadata.symbol).toBe('USDT');
    });
  });
});
