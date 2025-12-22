import { isAddress, getAddress, type Address } from 'viem';

/**
 * Validates and normalizes an Ethereum address
 * @param address - The address to validate
 * @returns The checksummed address if valid
 * @throws Error if address is invalid
 */
export function validateAddress(address: string): Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  return getAddress(address);
}

/**
 * Checks if a string is a valid Ethereum address
 * @param address - The address to check
 * @returns True if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Shortens an address for display purposes
 * @param address - The address to shorten
 * @param chars - Number of characters to show on each side (default: 4)
 * @returns Shortened address like "0x1234...5678"
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) {
    return address;
  }
  const checksummed = getAddress(address);
  return `${checksummed.slice(0, chars + 2)}...${checksummed.slice(-chars)}`;
}

/**
 * Compares two addresses for equality (case-insensitive)
 * @param a - First address
 * @param b - Second address
 * @returns True if addresses are equal
 */
export function addressEquals(a: string, b: string): boolean {
  if (!isValidAddress(a) || !isValidAddress(b)) {
    return false;
  }
  return getAddress(a).toLowerCase() === getAddress(b).toLowerCase();
}
