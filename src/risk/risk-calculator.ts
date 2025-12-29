import {
  RiskLevel,
  RiskCategory,
  RiskBreakdown,
  RiskAssessment,
} from './risk-types';
import {
  RiskThresholds,
  DEFAULT_THRESHOLDS,
  RiskFactors,
  getDormancyMultiplier,
  getValueMultiplier,
} from './risk-factors';
import { TokenApproval } from '../types';

export interface RiskCalculatorOptions {
  thresholds?: Partial<RiskThresholds>;
  dormancyDays?: number;
}

export class RiskCalculator {
  private thresholds: RiskThresholds;
  private dormancyDays: number;

  constructor(options: RiskCalculatorOptions = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...options.thresholds };
    this.dormancyDays = options.dormancyDays ?? 90;
  }

  calculateApprovalRisk(approval: TokenApproval): RiskAssessment {
    const breakdown: RiskBreakdown[] = [];
    let totalScore = 0;

    // Check unlimited allowance
    if (approval.isUnlimited) {
      const factor = RiskFactors[RiskCategory.UNLIMITED_ALLOWANCE];
      const score = factor.baseScore * factor.weight;
      breakdown.push({
        category: factor.category,
        score,
        description: factor.description,
        weight: factor.weight,
      });
      totalScore += score;
    }

    // Check dormancy
    if (approval.lastUsed) {
      const daysSinceUse = this.getDaysSince(approval.lastUsed);
      if (daysSinceUse > this.dormancyDays) {
        const factor = RiskFactors[RiskCategory.DORMANT_APPROVAL];
        const multiplier = getDormancyMultiplier(daysSinceUse);
        const score = factor.baseScore * factor.weight * multiplier;
        breakdown.push({
          category: factor.category,
          score,
          description: `${factor.description} (${daysSinceUse} days)`,
          weight: factor.weight * multiplier,
        });
        totalScore += score;
      }
    }

    // Check value risk
    if (approval.usdValue && approval.usdValue > 100) {
      const factor = RiskFactors[RiskCategory.HIGH_VALUE_TOKEN];
      const multiplier = getValueMultiplier(approval.usdValue);
      const score = factor.baseScore * factor.weight * multiplier;
      breakdown.push({
        category: factor.category,
        score,
        description: `${factor.description} ($${approval.usdValue.toFixed(2)})`,
        weight: factor.weight * multiplier,
      });
      totalScore += score;
    }

    // Apply recent approval discount
    if (approval.approvedAt) {
      const daysSinceApproval = this.getDaysSince(approval.approvedAt);
      if (daysSinceApproval < 7) {
        const factor = RiskFactors[RiskCategory.RECENT_APPROVAL];
        const score = factor.baseScore * factor.weight;
        breakdown.push({
          category: factor.category,
          score,
          description: factor.description,
          weight: factor.weight,
        });
        totalScore += score;
      }
    }

    // Normalize score to 0-100 range
    const normalizedScore = Math.max(0, Math.min(100, totalScore));
    const level = this.scoreToLevel(normalizedScore);
    const recommendations = this.generateRecommendations(breakdown, level);

    return {
      level,
      score: normalizedScore,
      breakdown,
      recommendations,
    };
  }

  private getDaysSince(timestamp: number): number {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private scoreToLevel(score: number): RiskLevel {
    if (score >= this.thresholds.critical) return RiskLevel.CRITICAL;
    if (score >= this.thresholds.high) return RiskLevel.HIGH;
    if (score >= this.thresholds.medium) return RiskLevel.MEDIUM;
    if (score >= this.thresholds.low) return RiskLevel.LOW;
    return RiskLevel.MINIMAL;
  }

  private generateRecommendations(
    breakdown: RiskBreakdown[],
    level: RiskLevel
  ): string[] {
    const recommendations: string[] = [];

    const hasUnlimited = breakdown.some(
      (b) => b.category === RiskCategory.UNLIMITED_ALLOWANCE
    );
    const isDormant = breakdown.some(
      (b) => b.category === RiskCategory.DORMANT_APPROVAL
    );
    const isHighValue = breakdown.some(
      (b) => b.category === RiskCategory.HIGH_VALUE_TOKEN
    );

    if (level === RiskLevel.CRITICAL || level === RiskLevel.HIGH) {
      recommendations.push('Immediate revocation recommended');
    }

    if (hasUnlimited) {
      recommendations.push(
        'Consider reducing allowance to specific amount needed'
      );
    }

    if (isDormant) {
      recommendations.push(
        'Approval appears unused - consider revoking if no longer needed'
      );
    }

    if (isHighValue) {
      recommendations.push(
        'High value at risk - ensure spender is trusted'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('No immediate action required');
    }

    return recommendations;
  }

  calculateAggregateRisk(approvals: TokenApproval[]): RiskAssessment {
    if (approvals.length === 0) {
      return {
        level: RiskLevel.MINIMAL,
        score: 0,
        breakdown: [],
        recommendations: ['No approvals found'],
      };
    }

    const assessments = approvals.map((a) => this.calculateApprovalRisk(a));
    const avgScore =
      assessments.reduce((sum, a) => sum + a.score, 0) / assessments.length;
    const maxScore = Math.max(...assessments.map((a) => a.score));

    // Weighted combination: 60% max, 40% average
    const combinedScore = maxScore * 0.6 + avgScore * 0.4;
    const normalizedScore = Math.max(0, Math.min(100, combinedScore));

    const allBreakdowns = assessments.flatMap((a) => a.breakdown);
    const uniqueCategories = [...new Set(allBreakdowns.map((b) => b.category))];
    const aggregatedBreakdown: RiskBreakdown[] = uniqueCategories.map((cat) => {
      const items = allBreakdowns.filter((b) => b.category === cat);
      const avgCatScore = items.reduce((s, i) => s + i.score, 0) / items.length;
      return {
        category: cat,
        score: avgCatScore,
        description: `${items.length} approval(s) with this risk factor`,
        weight: items[0].weight,
      };
    });

    return {
      level: this.scoreToLevel(normalizedScore),
      score: normalizedScore,
      breakdown: aggregatedBreakdown,
      recommendations: this.generateAggregateRecommendations(
        approvals.length,
        assessments
      ),
    };
  }

  private generateAggregateRecommendations(
    totalCount: number,
    assessments: RiskAssessment[]
  ): string[] {
    const recommendations: string[] = [];

    const criticalCount = assessments.filter(
      (a) => a.level === RiskLevel.CRITICAL
    ).length;
    const highCount = assessments.filter(
      (a) => a.level === RiskLevel.HIGH
    ).length;

    if (criticalCount > 0) {
      recommendations.push(
        `${criticalCount} critical risk approval(s) require immediate attention`
      );
    }

    if (highCount > 0) {
      recommendations.push(
        `${highCount} high risk approval(s) should be reviewed`
      );
    }

    recommendations.push(
      `Total of ${totalCount} approval(s) analyzed`
    );

    return recommendations;
  }
}
