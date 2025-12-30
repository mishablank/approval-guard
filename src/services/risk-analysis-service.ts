import type { ApprovalInfo, RiskAssessment } from '../types';
import { RiskCalculator, RiskLevel } from '../risk';
import { HistoryTracker } from '../history';

export interface RiskAnalysisOptions {
  includeHistory?: boolean;
  customWeights?: Partial<RiskWeights>;
}

export interface RiskWeights {
  unlimitedApproval: number;
  dormantApproval: number;
  unknownSpender: number;
  highValueToken: number;
}

const DEFAULT_WEIGHTS: RiskWeights = {
  unlimitedApproval: 40,
  dormantApproval: 25,
  unknownSpender: 20,
  highValueToken: 15,
};

export class RiskAnalysisService {
  private riskCalculator: RiskCalculator;
  private historyTracker: HistoryTracker | null;
  private weights: RiskWeights;

  constructor(
    riskCalculator?: RiskCalculator,
    historyTracker?: HistoryTracker,
    weights?: Partial<RiskWeights>
  ) {
    this.riskCalculator = riskCalculator || new RiskCalculator();
    this.historyTracker = historyTracker || null;
    this.weights = { ...DEFAULT_WEIGHTS, ...weights };
  }

  async analyzeApproval(
    approval: ApprovalInfo,
    options: RiskAnalysisOptions = {}
  ): Promise<RiskAssessment> {
    const { includeHistory = true } = options;

    const baseRisk = this.riskCalculator.calculateRisk(approval);

    let historyRisk = 0;
    if (includeHistory && this.historyTracker) {
      const history = await this.historyTracker.getHistory(approval.owner);
      const approvalHistory = history.find(
        h => h.tokenAddress === approval.tokenAddress && h.spender === approval.spender
      );

      if (approvalHistory) {
        const daysSinceApproval = this.calculateDaysSince(approvalHistory.timestamp);
        if (daysSinceApproval > 365) {
          historyRisk = this.weights.dormantApproval;
        } else if (daysSinceApproval > 180) {
          historyRisk = this.weights.dormantApproval * 0.5;
        }
      }
    }

    const totalScore = Math.min(100, baseRisk.score + historyRisk);
    const riskLevel = this.determineRiskLevel(totalScore);

    return {
      approval,
      riskScore: totalScore,
      riskLevel,
      factors: baseRisk.factors,
      recommendations: this.generateRecommendations(approval, riskLevel),
    };
  }

  async analyzeMultipleApprovals(
    approvals: ApprovalInfo[],
    options: RiskAnalysisOptions = {}
  ): Promise<RiskAssessment[]> {
    const assessments: RiskAssessment[] = [];

    for (const approval of approvals) {
      const assessment = await this.analyzeApproval(approval, options);
      assessments.push(assessment);
    }

    return assessments.sort((a, b) => b.riskScore - a.riskScore);
  }

  calculateOverallRiskScore(assessments: RiskAssessment[]): number {
    if (assessments.length === 0) return 0;

    const criticalCount = assessments.filter(a => a.riskLevel === 'critical').length;
    const highCount = assessments.filter(a => a.riskLevel === 'high').length;
    const totalScore = assessments.reduce((sum, a) => sum + a.riskScore, 0);
    const avgScore = totalScore / assessments.length;

    // Weight critical and high risk approvals more heavily
    const weightedScore = avgScore + (criticalCount * 10) + (highCount * 5);

    return Math.min(100, Math.round(weightedScore));
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private calculateDaysSince(timestamp: number): number {
    const now = Date.now();
    const diff = now - timestamp;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private generateRecommendations(
    approval: ApprovalInfo,
    riskLevel: RiskLevel
  ): string[] {
    const recommendations: string[] = [];

    const maxUint256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const isUnlimited = BigInt(approval.allowance) >= maxUint256 / 2n;

    if (riskLevel === 'critical') {
      recommendations.push('Immediate revocation recommended');
    }

    if (isUnlimited) {
      recommendations.push('Consider setting a specific allowance instead of unlimited');
    }

    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Review spender contract for security audits');
      recommendations.push('Consider revoking if not actively using this protocol');
    }

    if (riskLevel === 'medium') {
      recommendations.push('Monitor this approval regularly');
    }

    return recommendations;
  }

  setWeights(weights: Partial<RiskWeights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  getWeights(): RiskWeights {
    return { ...this.weights };
  }
}
