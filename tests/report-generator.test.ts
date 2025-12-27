import { ReportGenerator } from '../src/services/report-generator.js';
import { ApprovalData, RiskAssessment, RevocationRecommendation } from '../src/types.js';

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  
  const mockApprovals: ApprovalData[] = [
    {
      tokenAddress: '0x6B175474E89094C44Da98b954EescdeFBC7068Fd' as `0x${string}`,
      tokenName: 'Dai Stablecoin',
      tokenSymbol: 'DAI',
      tokenDecimals: 18,
      spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as `0x${string}`,
      spenderName: 'Uniswap V2 Router',
      allowance: BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935'),
      isUnlimited: true,
    },
    {
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
      tokenName: 'USD Coin',
      tokenSymbol: 'USDC',
      tokenDecimals: 6,
      spenderAddress: '0x1111111254fb6c44bAC0beD2854e76F90643097d' as `0x${string}`,
      spenderName: '1inch Router',
      allowance: BigInt('1000000000'),
      isUnlimited: false,
    },
  ];

  const mockRiskAssessments: RiskAssessment[] = [
    {
      tokenAddress: '0x6B175474E89094C44Da98b954EedscdeFBC7068Fd' as `0x${string}`,
      spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as `0x${string}`,
      riskScore: 75,
      riskLevel: 'high',
      factors: ['unlimited_approval', 'high_value_token'],
    },
    {
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
      spenderAddress: '0x1111111254fb6c44bAC0beD2854e76F90643097d' as `0x${string}`,
      riskScore: 25,
      riskLevel: 'low',
      factors: ['verified_spender'],
    },
  ];

  const mockRecommendations: RevocationRecommendation[] = [
    {
      tokenAddress: '0x6B175474E89094C44Da98b954EedscdeFBC7068Fd' as `0x${string}`,
      tokenSymbol: 'DAI',
      spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as `0x${string}`,
      spenderName: 'Uniswap V2 Router',
      shouldRevoke: true,
      priority: 3,
      reason: 'Unlimited approval on high-value token',
    },
  ];

  beforeEach(() => {
    generator = new ReportGenerator();
  });

  describe('generateReport', () => {
    it('should generate a complete report', () => {
      const report = generator.generateReport(
        '0xTestWallet',
        mockApprovals,
        mockRiskAssessments,
        mockRecommendations
      );

      expect(report.walletAddress).toBe('0xTestWallet');
      expect(report.summary.totalApprovals).toBe(2);
      expect(report.summary.highRiskCount).toBe(1);
      expect(report.summary.lowRiskCount).toBe(1);
      expect(report.approvals).toHaveLength(2);
      expect(report.recommendations).toHaveLength(1);
    });

    it('should calculate average risk score', () => {
      const report = generator.generateReport(
        '0xTestWallet',
        mockApprovals,
        mockRiskAssessments,
        mockRecommendations
      );

      expect(report.summary.totalRiskScore).toBe(50);
    });

    it('should handle empty approvals', () => {
      const report = generator.generateReport('0xTestWallet', [], [], []);

      expect(report.summary.totalApprovals).toBe(0);
      expect(report.summary.totalRiskScore).toBe(0);
      expect(report.summary.overallRiskLevel).toBe('low');
    });
  });

  describe('formatReport', () => {
    it('should format as JSON', () => {
      const report = generator.generateReport(
        '0xTestWallet',
        mockApprovals,
        mockRiskAssessments,
        mockRecommendations
      );

      const formatted = generator.formatReport(report, 'json');
      const parsed = JSON.parse(formatted);

      expect(parsed.walletAddress).toBe('0xTestWallet');
      expect(parsed.summary.totalApprovals).toBe(2);
    });

    it('should format as text', () => {
      const report = generator.generateReport(
        '0xTestWallet',
        mockApprovals,
        mockRiskAssessments,
        mockRecommendations
      );

      const formatted = generator.formatReport(report, 'text');

      expect(formatted).toContain('APPROVAL GUARD');
      expect(formatted).toContain('0xTestWallet');
      expect(formatted).toContain('Total Approvals: 2');
      expect(formatted).toContain('REVOCATION RECOMMENDATIONS');
    });

    it('should format as CSV', () => {
      const report = generator.generateReport(
        '0xTestWallet',
        mockApprovals,
        mockRiskAssessments,
        mockRecommendations
      );

      const formatted = generator.formatReport(report, 'csv');
      const lines = formatted.split('\n');

      expect(lines[0]).toContain('Token Symbol');
      expect(lines[0]).toContain('Risk Score');
      expect(lines.length).toBe(3); // header + 2 data rows
    });

    it('should escape CSV special characters', () => {
      const approvalWithComma: ApprovalData = {
        ...mockApprovals[0],
        tokenName: 'Token, With Comma',
      };

      const report = generator.generateReport(
        '0xTestWallet',
        [approvalWithComma],
        [mockRiskAssessments[0]],
        []
      );

      const formatted = generator.formatReport(report, 'csv');
      expect(formatted).toContain('"');
    });
  });
});
