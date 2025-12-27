import { RiskScorer } from '../src/risk-scorer';
import { Approval, RiskLevel } from '../src/types';

describe('RiskScorer', () => {
  let scorer: RiskScorer;

  beforeEach(() => {
    scorer = new RiskScorer();
  });

  const createMockApproval = (overrides: Partial<Approval> = {}): Approval => ({
    tokenAddress: '0x6B175474E89094C44Da98b954EescdA495351C7DC' as `0x${string}`,
    tokenSymbol: 'DAI',
    tokenName: 'Dai Stablecoin',
    tokenDecimals: 18,
    spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as `0x${string}`,
    spenderName: 'Uniswap V2 Router',
    value: BigInt('1000000000000000000'),
    transactionHash: '0x123' as `0x${string}`,
    blockNumber: BigInt(12345678),
    timestamp: new Date('2024-01-01'),
    lastUsed: new Date('2024-01-15'),
    spenderVerified: true,
    ...overrides
  });

  describe('scoreApproval', () => {
    it('should return zero score for zero-value approvals', () => {
      const approval = createMockApproval({ value: BigInt(0) });
      const result = scorer.scoreApproval(approval);

      expect(result.overall).toBe(0);
      expect(result.level).toBe(RiskLevel.LOW);
      expect(result.factors).toHaveLength(1);
      expect(result.factors[0].name).toBe('zero_approval');
    });

    it('should flag unlimited approvals as high risk', () => {
      const unlimitedValue = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      const approval = createMockApproval({ value: unlimitedValue });
      const result = scorer.scoreApproval(approval);

      expect(result.overall).toBeGreaterThan(70);
      expect(result.factors.some(f => f.name === 'unlimited_approval')).toBe(true);
    });

    it('should flag dormant approvals', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      
      const approval = createMockApproval({
        lastUsed: oldDate,
        value: BigInt('1000000000000000000')
      });
      const result = scorer.scoreApproval(approval);

      expect(result.factors.some(f => f.name === 'dormant_approval')).toBe(true);
    });

    it('should flag never-used approvals', () => {
      const approval = createMockApproval({
        lastUsed: undefined,
        value: BigInt('1000000000000000000')
      });
      const result = scorer.scoreApproval(approval);

      expect(result.factors.some(f => f.name === 'never_used')).toBe(true);
    });

    it('should flag unverified spenders', () => {
      const approval = createMockApproval({
        spenderVerified: false,
        value: BigInt('1000000000000000000')
      });
      const result = scorer.scoreApproval(approval);

      expect(result.factors.some(f => f.name === 'unverified_spender')).toBe(true);
    });

    it('should return low risk for verified, recently used, reasonable approvals', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      const approval = createMockApproval({
        lastUsed: recentDate,
        spenderVerified: true,
        value: BigInt('100000000000000000') // 0.1 tokens
      });
      const result = scorer.scoreApproval(approval);

      expect(result.level).toBe(RiskLevel.LOW);
    });
  });

  describe('scoreMultiple', () => {
    it('should score multiple approvals', () => {
      const approvals = [
        createMockApproval({ value: BigInt(0) }),
        createMockApproval({
          tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
          value: BigInt('1000000000000000000')
        })
      ];

      const results = scorer.scoreMultiple(approvals);
      expect(results.size).toBe(2);
    });
  });

  describe('getAggregateRisk', () => {
    it('should return LOW for empty scores array', () => {
      const result = scorer.getAggregateRisk([]);
      expect(result).toBe(RiskLevel.LOW);
    });

    it('should return highest risk level from scores', () => {
      const scores = [
        { overall: 20, level: RiskLevel.LOW, factors: [] },
        { overall: 85, level: RiskLevel.CRITICAL, factors: [] },
        { overall: 50, level: RiskLevel.MEDIUM, factors: [] }
      ];

      const result = scorer.getAggregateRisk(scores);
      expect(result).toBe(RiskLevel.CRITICAL);
    });
  });
});
