import { TokenApproval, RiskLevel } from '../types.js';

export interface ApprovalFilterOptions {
  minRiskScore?: number;
  maxRiskScore?: number;
  riskLevels?: RiskLevel[];
  onlyUnlimited?: boolean;
  onlyDormant?: boolean;
  dormantDays?: number;
  spenderAddresses?: string[];
  tokenAddresses?: string[];
}

export type SortField = 'riskScore' | 'allowance' | 'lastUsed' | 'tokenSymbol' | 'spender';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

export function filterApprovals(
  approvals: TokenApproval[],
  options: ApprovalFilterOptions
): TokenApproval[] {
  return approvals.filter((approval) => {
    // Filter by risk score range
    if (options.minRiskScore !== undefined && approval.riskScore < options.minRiskScore) {
      return false;
    }
    if (options.maxRiskScore !== undefined && approval.riskScore > options.maxRiskScore) {
      return false;
    }

    // Filter by risk levels
    if (options.riskLevels && options.riskLevels.length > 0) {
      if (!options.riskLevels.includes(approval.riskLevel)) {
        return false;
      }
    }

    // Filter unlimited approvals only
    if (options.onlyUnlimited && !approval.isUnlimited) {
      return false;
    }

    // Filter dormant approvals only
    if (options.onlyDormant) {
      const dormantDays = options.dormantDays ?? 90;
      if (!isDormantApproval(approval, dormantDays)) {
        return false;
      }
    }

    // Filter by specific spender addresses
    if (options.spenderAddresses && options.spenderAddresses.length > 0) {
      const normalizedSpenders = options.spenderAddresses.map((s) => s.toLowerCase());
      if (!normalizedSpenders.includes(approval.spender.toLowerCase())) {
        return false;
      }
    }

    // Filter by specific token addresses
    if (options.tokenAddresses && options.tokenAddresses.length > 0) {
      const normalizedTokens = options.tokenAddresses.map((t) => t.toLowerCase());
      if (!normalizedTokens.includes(approval.tokenAddress.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

export function sortApprovals(
  approvals: TokenApproval[],
  options: SortOptions
): TokenApproval[] {
  const sorted = [...approvals];
  const multiplier = options.order === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (options.field) {
      case 'riskScore':
        return (a.riskScore - b.riskScore) * multiplier;

      case 'allowance':
        return compareAllowances(a.allowance, b.allowance) * multiplier;

      case 'lastUsed':
        return compareLastUsed(a.lastUsed, b.lastUsed) * multiplier;

      case 'tokenSymbol':
        return (a.tokenSymbol ?? '').localeCompare(b.tokenSymbol ?? '') * multiplier;

      case 'spender':
        return a.spender.localeCompare(b.spender) * multiplier;

      default:
        return 0;
    }
  });

  return sorted;
}

export function isDormantApproval(approval: TokenApproval, dormantDays: number): boolean {
  if (!approval.lastUsed) {
    return true; // Never used is considered dormant
  }

  const lastUsedDate = new Date(approval.lastUsed);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dormantDays);

  return lastUsedDate < cutoffDate;
}

export function groupApprovalsByRiskLevel(
  approvals: TokenApproval[]
): Record<RiskLevel, TokenApproval[]> {
  const grouped: Record<RiskLevel, TokenApproval[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const approval of approvals) {
    grouped[approval.riskLevel].push(approval);
  }

  return grouped;
}

export function groupApprovalsByToken(
  approvals: TokenApproval[]
): Map<string, TokenApproval[]> {
  const grouped = new Map<string, TokenApproval[]>();

  for (const approval of approvals) {
    const tokenKey = approval.tokenAddress.toLowerCase();
    const existing = grouped.get(tokenKey) ?? [];
    existing.push(approval);
    grouped.set(tokenKey, existing);
  }

  return grouped;
}

export function groupApprovalsBySpender(
  approvals: TokenApproval[]
): Map<string, TokenApproval[]> {
  const grouped = new Map<string, TokenApproval[]>();

  for (const approval of approvals) {
    const spenderKey = approval.spender.toLowerCase();
    const existing = grouped.get(spenderKey) ?? [];
    existing.push(approval);
    grouped.set(spenderKey, existing);
  }

  return grouped;
}

function compareAllowances(a: string, b: string): number {
  try {
    const bigA = BigInt(a);
    const bigB = BigInt(b);
    if (bigA < bigB) return -1;
    if (bigA > bigB) return 1;
    return 0;
  } catch {
    return a.localeCompare(b);
  }
}

function compareLastUsed(a: string | undefined, b: string | undefined): number {
  if (!a && !b) return 0;
  if (!a) return -1; // undefined comes first (oldest)
  if (!b) return 1;

  const dateA = new Date(a).getTime();
  const dateB = new Date(b).getTime();

  return dateA - dateB;
}
