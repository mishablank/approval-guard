import { Approval, RiskScore, RiskLevel, RiskFactor } from './types';
import { RISK_THRESHOLDS } from './constants';

export class RiskScorer {
  private readonly UNLIMITED_APPROVAL_THRESHOLD = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') / BigInt(2);
  private readonly DORMANT_DAYS_THRESHOLD = 90;
  private readonly HIGH_VALUE_THRESHOLD = BigInt('1000000000000000000000'); // 1000 tokens with 18 decimals

  scoreApproval(approval: Approval): RiskScore {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // Handle zero-value approvals (already revoked or never set)
    if (approval.value === BigInt(0)) {
      return {
        overall: 0,
        level: RiskLevel.LOW,
        factors: [{
          name: 'zero_approval',
          score: 0,
          description: 'Approval has zero value (effectively revoked)',
          weight: 1
        }]
      };
    }

    // Check for unlimited approval
    const unlimitedFactor = this.checkUnlimitedApproval(approval);
    if (unlimitedFactor) {
      factors.push(unlimitedFactor);
      totalScore += unlimitedFactor.score * unlimitedFactor.weight;
    }

    // Check for dormant approval
    const dormantFactor = this.checkDormantApproval(approval);
    if (dormantFactor) {
      factors.push(dormantFactor);
      totalScore += dormantFactor.score * dormantFactor.weight;
    }

    // Check for unverified spender
    const unverifiedFactor = this.checkUnverifiedSpender(approval);
    if (unverifiedFactor) {
      factors.push(unverifiedFactor);
      totalScore += unverifiedFactor.score * unverifiedFactor.weight;
    }

    // Check for high value approval
    const highValueFactor = this.checkHighValueApproval(approval);
    if (highValueFactor) {
      factors.push(highValueFactor);
      totalScore += highValueFactor.score * highValueFactor.weight;
    }

    // Normalize score to 0-100
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const normalizedScore = totalWeight > 0 
      ? Math.min(100, Math.round((totalScore / totalWeight) * 100))
      : 0;

    return {
      overall: normalizedScore,
      level: this.calculateRiskLevel(normalizedScore),
      factors
    };
  }

  private checkUnlimitedApproval(approval: Approval): RiskFactor | null {
    if (approval.value >= this.UNLIMITED_APPROVAL_THRESHOLD) {
      return {
        name: 'unlimited_approval',
        score: 0.9,
        description: 'Unlimited token approval detected',
        weight: 3
      };
    }
    return null;
  }

  private checkDormantApproval(approval: Approval): RiskFactor | null {
    if (!approval.lastUsed) {
      // Never used approvals are also risky
      return {
        name: 'never_used',
        score: 0.6,
        description: 'Approval has never been used',
        weight: 2
      };
    }

    const daysSinceUse = Math.floor(
      (Date.now() - approval.lastUsed.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceUse > this.DORMANT_DAYS_THRESHOLD) {
      return {
        name: 'dormant_approval',
        score: 0.7,
        description: `Approval unused for ${daysSinceUse} days`,
        weight: 2
      };
    }

    return null;
  }

  private checkUnverifiedSpender(approval: Approval): RiskFactor | null {
    if (!approval.spenderVerified) {
      return {
        name: 'unverified_spender',
        score: 0.5,
        description: 'Spender contract is not verified',
        weight: 1.5
      };
    }
    return null;
  }

  private checkHighValueApproval(approval: Approval): RiskFactor | null {
    // Skip if unlimited (already covered)
    if (approval.value >= this.UNLIMITED_APPROVAL_THRESHOLD) {
      return null;
    }

    if (approval.value >= this.HIGH_VALUE_THRESHOLD) {
      return {
        name: 'high_value',
        score: 0.4,
        description: 'High value approval amount',
        weight: 1
      };
    }
    return null;
  }

  private calculateRiskLevel(score: number): RiskLevel {
    if (score >= RISK_THRESHOLDS.CRITICAL) {
      return RiskLevel.CRITICAL;
    }
    if (score >= RISK_THRESHOLDS.HIGH) {
      return RiskLevel.HIGH;
    }
    if (score >= RISK_THRESHOLDS.MEDIUM) {
      return RiskLevel.MEDIUM;
    }
    return RiskLevel.LOW;
  }

  scoreMultiple(approvals: Approval[]): Map<string, RiskScore> {
    const scores = new Map<string, RiskScore>();
    
    for (const approval of approvals) {
      const key = `${approval.tokenAddress}-${approval.spenderAddress}`;
      scores.set(key, this.scoreApproval(approval));
    }

    return scores;
  }

  getAggregateRisk(scores: RiskScore[]): RiskLevel {
    if (scores.length === 0) {
      return RiskLevel.LOW;
    }

    const maxScore = Math.max(...scores.map(s => s.overall));
    return this.calculateRiskLevel(maxScore);
  }
}

export const riskScorer = new RiskScorer();
