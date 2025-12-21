import type { TokenApproval, RiskScore, RiskLevel } from './types';
import {
  UNLIMITED_THRESHOLD,
  DORMANT_DAYS_THRESHOLD,
  RISK_WEIGHTS,
  RISK_THRESHOLDS,
} from './constants';

/**
 * Calculate the number of days since a given timestamp
 */
function daysSince(timestamp: number): number {
  const now = Date.now();
  const diff = now - timestamp * 1000; // Convert seconds to milliseconds
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Determine if an approval amount is considered unlimited
 */
export function isUnlimitedApproval(amount: bigint): boolean {
  return amount >= UNLIMITED_THRESHOLD;
}

/**
 * Determine if an approval is dormant (not used recently)
 */
export function isDormantApproval(lastUsedTimestamp: number | null): boolean {
  if (lastUsedTimestamp === null) {
    return true; // Never used approvals are considered dormant
  }
  return daysSince(lastUsedTimestamp) > DORMANT_DAYS_THRESHOLD;
}

/**
 * Get risk level based on score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'critical';
  if (score >= RISK_THRESHOLDS.HIGH) return 'high';
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Calculate risk score for a single token approval
 */
export function calculateApprovalRisk(approval: TokenApproval): RiskScore {
  let score = 0;
  const factors: string[] = [];

  // Check for unlimited approval
  if (isUnlimitedApproval(approval.allowance)) {
    score += RISK_WEIGHTS.UNLIMITED_APPROVAL;
    factors.push('Unlimited approval amount');
  }

  // Check for dormant approval
  if (isDormantApproval(approval.lastUsed)) {
    score += RISK_WEIGHTS.DORMANT_APPROVAL;
    factors.push(`Dormant for over ${DORMANT_DAYS_THRESHOLD} days`);
  }

  // Check if spender is verified
  if (!approval.spenderVerified) {
    score += RISK_WEIGHTS.UNVERIFIED_SPENDER;
    factors.push('Unverified spender contract');
  }

  // Check if spender name is unknown
  if (!approval.spenderName || approval.spenderName === 'Unknown') {
    score += RISK_WEIGHTS.UNKNOWN_SPENDER;
    factors.push('Unknown spender identity');
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    score,
    level: getRiskLevel(score),
    factors,
    recommendation: generateRecommendation(score, factors),
  };
}

/**
 * Generate a recommendation based on risk score and factors
 */
function generateRecommendation(score: number, factors: string[]): string {
  const level = getRiskLevel(score);

  switch (level) {
    case 'critical':
      return 'Immediate revocation recommended. This approval poses significant security risks.';
    case 'high':
      return 'Revocation strongly recommended. Consider removing this approval soon.';
    case 'medium':
      return 'Review this approval. Consider revoking if the spender is not actively used.';
    case 'low':
      return 'Low risk approval. Monitor periodically.';
    default:
      return 'Unable to determine recommendation.';
  }
}

/**
 * Calculate aggregate risk score for all approvals
 */
export function calculateWalletRiskScore(approvals: TokenApproval[]): {
  overallScore: number;
  overallLevel: RiskLevel;
  approvalRisks: Map<string, RiskScore>;
} {
  const approvalRisks = new Map<string, RiskScore>();
  let totalScore = 0;

  for (const approval of approvals) {
    const key = `${approval.tokenAddress}-${approval.spenderAddress}`;
    const risk = calculateApprovalRisk(approval);
    approvalRisks.set(key, risk);
    totalScore += risk.score;
  }

  // Calculate average score, weighted by number of high-risk approvals
  const averageScore = approvals.length > 0 ? totalScore / approvals.length : 0;
  const highRiskCount = Array.from(approvalRisks.values()).filter(
    (r) => r.level === 'high' || r.level === 'critical'
  ).length;

  // Boost overall score if there are multiple high-risk approvals
  const boostedScore = Math.min(
    100,
    averageScore + highRiskCount * 5
  );

  return {
    overallScore: Math.round(boostedScore),
    overallLevel: getRiskLevel(boostedScore),
    approvalRisks,
  };
}
