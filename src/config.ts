import { config as dotenvConfig } from 'dotenv';
import { Chain, mainnet, arbitrum, optimism, polygon, base } from 'viem/chains';

dotenvConfig();

export interface AppConfig {
  rpcUrl: string;
  chainId: number;
  chain: Chain;
  etherscanApiKey?: string;
}

const SUPPORTED_CHAINS: Record<number, Chain> = {
  1: mainnet,
  42161: arbitrum,
  10: optimism,
  137: polygon,
  8453: base,
};

export function getConfig(): AppConfig {
  const rpcUrl = process.env.ETH_RPC_URL;
  if (!rpcUrl) {
    throw new Error('ETH_RPC_URL environment variable is required');
  }

  const chainId = parseInt(process.env.CHAIN_ID || '1', 10);
  const chain = SUPPORTED_CHAINS[chainId];
  
  if (!chain) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`
    );
  }

  return {
    rpcUrl,
    chainId,
    chain,
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || undefined,
  };
}

export const SUPPORTED_CHAIN_IDS = Object.keys(SUPPORTED_CHAINS).map(Number);