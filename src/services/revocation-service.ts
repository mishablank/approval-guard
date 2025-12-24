import { Approval, RiskScore, RevocationRecommendation, RiskLevel } from '../types.js';
import { RISK_THRESHOLDS } from '../constants.js';

export interface RevocationPriority {
  approval: Approval;
  riskScore: RiskScore;
  recommendation: RevocationRecommendation;
  priority: number;
}

export class RevocationService {
  private readonly riskWeights = {
    unlimited: 3,
    dormant: 2,
    highValue: 2.5,
    unknownSpender: 1.5,
    recentlyCompromised: 4,
  };

  generateRecommendations(
    approvals: Approval[],
    riskScores: Map<string, RiskScore>
  ): RevocationRecommendation[] {
    const recommendations: RevocationRecommendation[] = [];

    for (const approval of approvals) {
      const key = this.getApprovalKey(approval);
      const riskScore = riskScores.get(key);

      if (!riskScore) {
        continue;
      }

      const recommendation = this.createRecommendation(approval, riskScore);
      recommendations.push(recommendation);
    }

    return this.sortByPriority(recommendations);
  }

  private createRecommendation(
    approval: Approval,
    riskScore: RiskScore
  ): RevocationRecommendation {
    const shouldRevoke = this.shouldRecommendRevocation(riskScore);
    const urgency = this.calculateUrgency(riskScore);
    const reason = this.generateReason(approval, riskScore);
    const estimatedGasCost = this.estimateGasCost();

    return {
      approval,
      riskScore,
      shouldRevoke,
      urgency,
      reason,
      estimatedGasCost,
      createdAt: new Date(),
    };
  }

  private shouldRecommendRevocation(riskScore: RiskScore): boolean {
    if (riskScore.level === 'critical' || riskScore.level === 'high') {
      return true;
    }

    if (riskScore.level === 'medium' && riskScore.factors.length >= 2) {
      return true;
    }

    return false;
  }

  private calculateUrgency(riskScore: RiskScore): 'immediate' | 'high' | 'medium' | 'low' {
    if (riskScore.level === 'critical') {
      return 'immediate';
    }

    if (riskScore.level === 'high') {
      return 'high';
    }

    if (riskScore.level === 'medium') {
      return 'medium';
    }

    return 'low';
  }

  private generateReason(approval: Approval, riskScore: RiskScore): string {
    const reasons: string[] = [];

    if (approval.isUnlimited) {
      reasons.push('Unlimited approval poses significant risk if spender is compromised');
    }

    const dormantFactor = riskScore.factors.find(f => f.name === 'dormant_approval');
    if (dormantFactor) {
      reasons.push('Approval has been dormant and may no longer be needed');
    }

    const unknownFactor = riskScore.factors.find(f => f.name === 'unknown_spender');
    if (unknownFactor) {
      reasons.push('Spender contract is not verified or recognized');
    }

    const highValueFactor = riskScore.factors.find(f => f.name === 'high_value_approval');
    if (highValueFactor) {
      reasons.push('High value at risk relative to wallet holdings');
    }

    if (reasons.length === 0) {
      reasons.push('General security hygiene recommendation');
    }

    return reasons.join('. ');
  }

  private estimateGasCost(): bigint {
    // Approximate gas cost for an ERC-20 approve(spender, 0) call
    // Typically around 45,000 gas units
    return BigInt(45000);
  }

  private sortByPriority(recommendations: RevocationRecommendation[]): RevocationRecommendation[] {
    const urgencyOrder = {
      immediate: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return recommendations.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }

      return b.riskScore.score - a.riskScore.score;
    });
  }

  private getApprovalKey(approval: Approval): string {
    return `${approval.tokenAddress.toLowerCase()}-${approval.spenderAddress.toLowerCase()}`;
  }

  getPrioritizedRevocations(
    approvals: Approval[],
    riskScores: Map<string, RiskScore>
  ): RevocationPriority[] {
    const recommendations = this.generateRecommendations(approvals, riskScores);

    return recommendations
      .filter(rec => rec.shouldRevoke)
      .map(rec => ({
        approval: rec.approval,
        riskScore: rec.riskScore,
        recommendation: rec,
        priority: this.calculatePriorityScore(rec),
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  private calculatePriorityScore(recommendation: RevocationRecommendation): number {
    let score = recommendation.riskScore.score;

    for (const factor of recommendation.riskScore.factors) {
      const weight = this.riskWeights[factor.name as keyof typeof this.riskWeights] || 1;
      score += factor.impact * weight;
    }

    return score;
  }

  estimateTotalRevocationCost(
    recommendations: RevocationRecommendation[],
    gasPrice: bigint
  ): bigint {
    const revocationsNeeded = recommendations.filter(r => r.shouldRevoke);
    const totalGas = revocationsNeeded.reduce(
      (sum, r) => sum + r.estimatedGasCost,
      BigInt(0)
    );

    return totalGas * gasPrice;
  }

  getRevocationSummary(recommendations: RevocationRecommendation[]): {
    total: number;
    immediate: number;
    high: number;
    medium: number;
    low: number;
    noAction: number;
  } {
    const summary = {
      total: recommendations.length,
      immediate: 0,
      high: 0,
      medium: 0,
      low: 0,
      noAction: 0,
    };

    for (const rec of recommendations) {
      if (!rec.shouldRevoke) {
        summary.noAction++;
      } else {
        summary[rec.urgency]++;
      }
    }

    return summary;
  }
}

export const revocationService = new RevocationService();
