/**
 * Risk scoring constants and thresholds
 */

// Maximum uint256 value (unlimited approval)
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

// Threshold for considering an approval as "unlimited" (99% of max)
export const UNLIMITED_THRESHOLD = MAX_UINT256 * BigInt(99) / BigInt(100);

// Days after which an approval is considered dormant
export const DORMANT_DAYS_THRESHOLD = 90;

// Risk score weights
export const RISK_WEIGHTS = {
  UNLIMITED_APPROVAL: 40,
  DORMANT_APPROVAL: 25,
  UNVERIFIED_SPENDER: 20,
  HIGH_VALUE_TOKEN: 10,
  UNKNOWN_SPENDER: 15,
} as const;

// Risk level thresholds
export const RISK_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 90,
} as const;

// Common trusted spender categories
export const TRUSTED_PROTOCOLS = [
  'uniswap',
  'aave',
  'compound',
  'curve',
  'balancer',
  'sushiswap',
  '1inch',
  'opensea',
] as const;
