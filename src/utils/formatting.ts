import { formatUnits, parseUnits } from 'viem';
import { UNLIMITED_APPROVAL_THRESHOLD } from '../constants';

/**
 * Formats a token amount for display
 * @param amount - The raw token amount as bigint
 * @param decimals - Token decimals (default: 18)
 * @returns Formatted string representation
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  if (amount >= UNLIMITED_APPROVAL_THRESHOLD) {
    return 'Unlimited';
  }
  
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) {
    return '0';
  }
  
  if (num < 0.0001) {
    return '<0.0001';
  }
  
  if (num < 1) {
    return num.toFixed(4);
  }
  
  if (num < 1000) {
    return num.toFixed(2);
  }
  
  if (num < 1000000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  
  if (num < 1000000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  
  return `${(num / 1000000000).toFixed(2)}B`;
}

/**
 * Formats a timestamp to a human-readable date string
 * @param timestamp - Unix timestamp in seconds
 * @returns ISO date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Calculates the number of days since a timestamp
 * @param timestamp - Unix timestamp in seconds
 * @returns Number of days (rounded down)
 */
export function daysSince(timestamp: number): number {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  return Math.floor(diff / (60 * 60 * 24));
}

/**
 * Formats a risk score as a percentage string
 * @param score - Risk score between 0 and 100
 * @returns Formatted percentage string
 */
export function formatRiskScore(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Converts a hex string to a number
 * @param hex - Hex string (with or without 0x prefix)
 * @returns The numeric value
 */
export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}
