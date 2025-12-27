import { createPublicClient, http, type Address, type PublicClient } from 'viem';
import { mainnet, goerli, sepolia, polygon, arbitrum, optimism } from 'viem/chains';
import { config } from '../config.js';
import { NetworkError } from '../errors/index.js';
import { ApprovalCache } from '../cache/approval-cache.js';

export interface TokenMetadata {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
  logoUrl?: string;
  verified?: boolean;
  priceUsd?: number;
}

const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const KNOWN_TOKENS: Record<string, Partial<TokenMetadata>> = {
  '0xdac17f958d2ee523a2206206994597c13d831ec7': {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    verified: true,
  },
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    verified: true,
  },
  '0x6b175474e89094c44da98b954eedeac495271d0f': {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    verified: true,
  },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
    name: 'Wrapped BTC',
    symbol: 'WBTC',
    decimals: 8,
    verified: true,
  },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    verified: true,
  },
};

const CHAIN_MAP = {
  mainnet,
  goerli,
  sepolia,
  polygon,
  arbitrum,
  optimism,
} as const;

export class TokenMetadataService {
  private client: PublicClient;
  private cache: ApprovalCache;
  private metadataCache: Map<string, TokenMetadata> = new Map();

  constructor(rpcUrl?: string) {
    const chain = CHAIN_MAP[config.network as keyof typeof CHAIN_MAP] || mainnet;
    
    this.client = createPublicClient({
      chain,
      transport: http(rpcUrl || config.rpcUrl),
    });
    
    this.cache = new ApprovalCache();
  }

  async getTokenMetadata(tokenAddress: Address): Promise<TokenMetadata> {
    const normalizedAddress = tokenAddress.toLowerCase();
    
    // Check in-memory cache first
    const cached = this.metadataCache.get(normalizedAddress);
    if (cached) {
      return cached;
    }

    // Check known tokens
    const known = KNOWN_TOKENS[normalizedAddress];
    if (known && known.name && known.symbol && known.decimals !== undefined) {
      const metadata: TokenMetadata = {
        address: tokenAddress,
        name: known.name,
        symbol: known.symbol,
        decimals: known.decimals,
        verified: known.verified,
      };
      this.metadataCache.set(normalizedAddress, metadata);
      return metadata;
    }

    // Fetch from chain
    return this.fetchTokenMetadata(tokenAddress);
  }

  private async fetchTokenMetadata(tokenAddress: Address): Promise<TokenMetadata> {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'name',
        }).catch(() => 'Unknown Token'),
        this.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }).catch(() => 'UNKNOWN'),
        this.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }).catch(() => 18),
        this.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }).catch(() => undefined),
      ]);

      const metadata: TokenMetadata = {
        address: tokenAddress,
        name: name as string,
        symbol: symbol as string,
        decimals: decimals as number,
        totalSupply: totalSupply as bigint | undefined,
        verified: false,
      };

      this.metadataCache.set(tokenAddress.toLowerCase(), metadata);
      return metadata;
    } catch (error) {
      throw new NetworkError(
        `Failed to fetch metadata for token ${tokenAddress}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async getMultipleTokenMetadata(tokenAddresses: Address[]): Promise<Map<Address, TokenMetadata>> {
    const results = new Map<Address, TokenMetadata>();
    const uniqueAddresses = [...new Set(tokenAddresses)];

    const metadataPromises = uniqueAddresses.map(async (address) => {
      try {
        const metadata = await this.getTokenMetadata(address);
        return { address, metadata };
      } catch {
        return {
          address,
          metadata: {
            address,
            name: 'Unknown',
            symbol: 'UNKNOWN',
            decimals: 18,
            verified: false,
          } as TokenMetadata,
        };
      }
    });

    const resolvedMetadata = await Promise.all(metadataPromises);
    
    for (const { address, metadata } of resolvedMetadata) {
      results.set(address, metadata);
    }

    return results;
  }

  formatTokenAmount(amount: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    if (trimmedFractional) {
      return `${integerPart}.${trimmedFractional}`;
    }
    
    return integerPart.toString();
  }

  isKnownToken(tokenAddress: Address): boolean {
    return tokenAddress.toLowerCase() in KNOWN_TOKENS;
  }

  clearCache(): void {
    this.metadataCache.clear();
  }
}

export const tokenMetadataService = new TokenMetadataService();
