import {
  filterApprovals,
  sortApprovals,
  isDormantApproval,
  groupApprovalsByRiskLevel,
  groupApprovalsByToken,
  groupApprovalsBySpender,
} from '../src/utils/approval-filters.js';
import { TokenApproval, RiskLevel } from '../src/types.js';

const createMockApproval = (overrides: Partial<TokenApproval> = {}): TokenApproval => ({
  tokenAddress: '0x1234567890123456789012345678901234567890',
  tokenSymbol: 'TEST',
  tokenDecimals: 18,
  spender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  spenderName: 'Test Spender',
  allowance: '1000000000000000000',
  isUnlimited: false,
  riskScore: 50,
  riskLevel: 'medium' as RiskLevel,
  riskFactors: [],
  ...overrides,
});

describe('filterApprovals', () => {
  const approvals: TokenApproval[] = [
    createMockApproval({ riskScore: 30, riskLevel: 'low' }),
    createMockApproval({ riskScore: 50, riskLevel: 'medium' }),
    createMockApproval({ riskScore: 75, riskLevel: 'high', isUnlimited: true }),
    createMockApproval({ riskScore: 95, riskLevel: 'critical', isUnlimited: true }),
  ];

  it('filters by minimum risk score', () => {
    const result = filterApprovals(approvals, { minRiskScore: 50 });
    expect(result).toHaveLength(3);
    expect(result.every((a) => a.riskScore >= 50)).toBe(true);
  });

  it('filters by maximum risk score', () => {
    const result = filterApprovals(approvals, { maxRiskScore: 50 });
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.riskScore <= 50)).toBe(true);
  });

  it('filters by risk levels', () => {
    const result = filterApprovals(approvals, { riskLevels: ['high', 'critical'] });
    expect(result).toHaveLength(2);
    expect(result.every((a) => ['high', 'critical'].includes(a.riskLevel))).toBe(true);
  });

  it('filters unlimited approvals only', () => {
    const result = filterApprovals(approvals, { onlyUnlimited: true });
    expect(result).toHaveLength(2);
    expect(result.every((a) => a.isUnlimited)).toBe(true);
  });

  it('returns all approvals when no filters are applied', () => {
    const result = filterApprovals(approvals, {});
    expect(result).toHaveLength(4);
  });
});

describe('sortApprovals', () => {
  const approvals: TokenApproval[] = [
    createMockApproval({ riskScore: 50, tokenSymbol: 'BBB' }),
    createMockApproval({ riskScore: 30, tokenSymbol: 'AAA' }),
    createMockApproval({ riskScore: 80, tokenSymbol: 'CCC' }),
  ];

  it('sorts by risk score ascending', () => {
    const result = sortApprovals(approvals, { field: 'riskScore', order: 'asc' });
    expect(result[0].riskScore).toBe(30);
    expect(result[1].riskScore).toBe(50);
    expect(result[2].riskScore).toBe(80);
  });

  it('sorts by risk score descending', () => {
    const result = sortApprovals(approvals, { field: 'riskScore', order: 'desc' });
    expect(result[0].riskScore).toBe(80);
    expect(result[1].riskScore).toBe(50);
    expect(result[2].riskScore).toBe(30);
  });

  it('sorts by token symbol', () => {
    const result = sortApprovals(approvals, { field: 'tokenSymbol', order: 'asc' });
    expect(result[0].tokenSymbol).toBe('AAA');
    expect(result[1].tokenSymbol).toBe('BBB');
    expect(result[2].tokenSymbol).toBe('CCC');
  });
});

describe('isDormantApproval', () => {
  it('returns true for approvals without lastUsed', () => {
    const approval = createMockApproval({ lastUsed: undefined });
    expect(isDormantApproval(approval, 90)).toBe(true);
  });

  it('returns true for old approvals', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    const approval = createMockApproval({ lastUsed: oldDate.toISOString() });
    expect(isDormantApproval(approval, 90)).toBe(true);
  });

  it('returns false for recent approvals', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);
    const approval = createMockApproval({ lastUsed: recentDate.toISOString() });
    expect(isDormantApproval(approval, 90)).toBe(false);
  });
});

describe('groupApprovalsByRiskLevel', () => {
  it('groups approvals correctly', () => {
    const approvals: TokenApproval[] = [
      createMockApproval({ riskLevel: 'low' }),
      createMockApproval({ riskLevel: 'medium' }),
      createMockApproval({ riskLevel: 'medium' }),
      createMockApproval({ riskLevel: 'critical' }),
    ];

    const grouped = groupApprovalsByRiskLevel(approvals);

    expect(grouped.low).toHaveLength(1);
    expect(grouped.medium).toHaveLength(2);
    expect(grouped.high).toHaveLength(0);
    expect(grouped.critical).toHaveLength(1);
  });
});

describe('groupApprovalsByToken', () => {
  it('groups by token address case-insensitively', () => {
    const approvals: TokenApproval[] = [
      createMockApproval({ tokenAddress: '0xABC' }),
      createMockApproval({ tokenAddress: '0xabc' }),
      createMockApproval({ tokenAddress: '0xDEF' }),
    ];

    const grouped = groupApprovalsByToken(approvals);

    expect(grouped.size).toBe(2);
    expect(grouped.get('0xabc')).toHaveLength(2);
    expect(grouped.get('0xdef')).toHaveLength(1);
  });
});

describe('groupApprovalsBySpender', () => {
  it('groups by spender address case-insensitively', () => {
    const approvals: TokenApproval[] = [
      createMockApproval({ spender: '0xABC' }),
      createMockApproval({ spender: '0xabc' }),
      createMockApproval({ spender: '0xDEF' }),
    ];

    const grouped = groupApprovalsBySpender(approvals);

    expect(grouped.size).toBe(2);
    expect(grouped.get('0xabc')).toHaveLength(2);
    expect(grouped.get('0xdef')).toHaveLength(1);
  });
});
