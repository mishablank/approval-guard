import { RiskCategory } from './risk-types';

export interface RiskThresholds {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export const DEFAULT_THRESHOLDS: RiskThresholds = {
  critical: 90,
  high: 70,
  medium: 40,
  low: 20,
};

export interface RiskFactorConfig {
  category: RiskCategory;
  baseScore: number;
  weight: number;
  description: string;
}

export const RiskFactors: Record<RiskCategory, RiskFactorConfig> = {
  [RiskCategory.UNLIMITED_ALLOWANCE]: {
    category: RiskCategory.UNLIMITED_ALLOWANCE,
    baseScore: 50,
    weight: 1.5,
    description: 'Unlimited token approval poses maximum risk',
  },
  [RiskCategory.DORMANT_APPROVAL]: {
    category: RiskCategory.DORMANT_APPROVAL,
    baseScore: 30,
    weight: 1.2,
    description: 'Approval has not been used for extended period',
  },
  [RiskCategory.UNVERIFIED_SPENDER]: {
    category: RiskCategory.UNVERIFIED_SPENDER,
    baseScore: 40,
    weight: 1.3,
    description: 'Spender contract is not verified on Etherscan',
  },
  [RiskCategory.HIGH_VALUE_TOKEN]: {
    category: RiskCategory.HIGH_VALUE_TOKEN,
    baseScore: 25,
    weight: 1.1,
    description: 'Token has significant monetary value',
  },
  [RiskCategory.SUSPICIOUS_CONTRACT]: {
    category: RiskCategory.SUSPICIOUS_CONTRACT,
    baseScore: 60,
    weight: 1.4,
    description: 'Spender contract shows suspicious patterns',
  },
  [RiskCategory.RECENT_APPROVAL]: {
    category: RiskCategory.RECENT_APPROVAL,
    baseScore: -10,
    weight: 0.8,
    description: 'Recent approval may be intentionally active',
  },
};

export function getDormancyMultiplier(daysSinceLastUse: number): number {
  if (daysSinceLastUse > 365) return 1.5;
  if (daysSinceLastUse > 180) return 1.3;
  if (daysSinceLastUse > 90) return 1.1;
  if (daysSinceLastUse > 30) return 1.0;
  return 0.8;
}

export function getValueMultiplier(usdValue: number): number {
  if (usdValue > 100000) return 2.0;
  if (usdValue > 10000) return 1.5;
  if (usdValue > 1000) return 1.2;
  if (usdValue > 100) return 1.0;
  return 0.7;
}
