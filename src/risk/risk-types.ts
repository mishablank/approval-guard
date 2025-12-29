export enum RiskLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  MINIMAL = 'minimal',
}

export enum RiskCategory {
  UNLIMITED_ALLOWANCE = 'unlimited_allowance',
  DORMANT_APPROVAL = 'dormant_approval',
  UNVERIFIED_SPENDER = 'unverified_spender',
  HIGH_VALUE_TOKEN = 'high_value_token',
  SUSPICIOUS_CONTRACT = 'suspicious_contract',
  RECENT_APPROVAL = 'recent_approval',
}

export interface RiskBreakdown {
  category: RiskCategory;
  score: number;
  description: string;
  weight: number;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  breakdown: RiskBreakdown[];
  recommendations: string[];
}
