import { TokenApproval, RiskAssessment, RiskLevel } from '../types';
import { RISK_WEIGHTS, UNLIMITED_APPROVAL_THRESHOLD } from '../constants';

export interface RiskAnalysisConfig {
  unlimitedThreshold?: bigint;
  dormantDays?: number;
  customWeights?: Partial<typeof RISK_WEIGHTS>;
}

export class RiskAnalysisService {
  private unlimitedThreshold: bigint;
  private dormantDays: number;
  private weights: typeof RISK_WEIGHTS;

  constructor(config: RiskAnalysisConfig = {}) {
    this.unlimitedThreshold = config.unlimitedThreshold ?? UNLIMITED_APPROVAL_THRESHOLD;
    this.dormantDays = config.dormantDays ?? 90;
    this.weights = { ...RISK_WEIGHTS, ...config.customWeights };
  }

  analyzeApproval(approval: TokenApproval): RiskAssessment {
    const factors: string[] = [];
    let score = 0;

    // Check for unlimited approval
    const isUnlimited = this.isUnlimitedApproval(approval.allowance);
    if (isUnlimited) {
      score += this.weights.UNLIMITED_APPROVAL;
      factors.push('Unlimited approval amount');
    }

    // Check for dormant approval
    const isDormant = this.isDormantApproval(approval.lastUsed);
    if (isDormant) {
      score += this.weights.DORMANT_APPROVAL;
      factors.push(`No activity in ${this.dormantDays}+ days`);
    }

    // Check spender reputation (placeholder for future implementation)
    const spenderRisk = this.assessSpenderRisk(approval.spenderAddress);
    if (spenderRisk > 0) {
      score += spenderRisk;
      factors.push('Unknown or risky spender');
    }

    const level = this.calculateRiskLevel(score);
    const recommendation = this.generateRecommendation(level, factors);

    return {
      level,
      score: Math.min(score, 100),
      factors,
      recommendation,
    };
  }

  analyzeMultipleApprovals(approvals: TokenApproval[]): Map<string, RiskAssessment> {
    const assessments = new Map<string, RiskAssessment>();

    for (const approval of approvals) {
      const key = `${approval.tokenAddress}-${approval.spenderAddress}`;
      assessments.set(key, this.analyzeApproval(approval));
    }

    return assessments;
  }

  getOverallRiskScore(assessments: RiskAssessment[]): number {
    if (assessments.length === 0) return 0;

    const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
    const avgScore = totalScore / assessments.length;
    const maxScore = Math.max(...assessments.map((a) => a.score));

    // Weight average and max scores
    return Math.round(avgScore * 0.6 + maxScore * 0.4);
  }

  private isUnlimitedApproval(allowance: string): boolean {
    try {
      return BigInt(allowance) >= this.unlimitedThreshold;
    } catch {
      return false;
    }
  }

  private isDormantApproval(lastUsed?: string): boolean {
    if (!lastUsed) return true;

    const lastUsedDate = new Date(lastUsed);
    const daysSinceUse = (Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUse >= this.dormantDays;
  }

  private assessSpenderRisk(spenderAddress: string): number {
    // Placeholder for spender risk assessment
    // Future: Check against known malicious addresses, verify contracts, etc.
    return 0;
  }

  private calculateRiskLevel(score: number): RiskLevel {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private generateRecommendation(level: RiskLevel, factors: string[]): string {
    switch (level) {
      case 'critical':
        return 'Immediate revocation strongly recommended';
      case 'high':
        return 'Consider revoking this approval soon';
      case 'medium':
        return 'Review and consider reducing approval amount';
      case 'low':
        return 'No immediate action required';
      default:
        return 'Unable to determine recommendation';
    }
  }
}
