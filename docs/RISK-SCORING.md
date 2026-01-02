# Risk Scoring Guide

This document explains how Approval Guard calculates risk scores for token approvals.

## Overview

Risk scoring is a core feature that helps users understand the potential danger of their token approvals. Each approval receives a score from 0-100, where higher scores indicate greater risk.

## Risk Levels

| Level | Score Range | Description |
|-------|-------------|-------------|
| Critical | 80-100 | Immediate action recommended |
| High | 60-79 | Should be reviewed soon |
| Medium | 40-59 | Monitor periodically |
| Low | 20-39 | Generally safe |
| Minimal | 0-19 | Very low risk |

## Risk Factors

### 1. Unlimited Allowance (Weight: 30%)

Approvals for the maximum uint256 value (`type(uint256).max`) are considered "unlimited" and pose significant risk.

**Scoring:**
- Unlimited allowance: +30 points
- High allowance (>1M tokens): +20 points
- Moderate allowance: +10 points
- Low allowance: +0 points

**Why it matters:** An unlimited allowance means a spender can transfer ALL of your tokens at any time, not just what you intended.

### 2. Dormant Approvals (Weight: 25%)

Approvals that haven't been used recently may be forgotten and pose ongoing risk.

**Scoring:**
- No activity in 365+ days: +25 points
- No activity in 180+ days: +20 points
- No activity in 90+ days: +15 points
- No activity in 30+ days: +10 points
- Recent activity: +0 points

**Why it matters:** Old, unused approvals are often forgotten but remain active attack vectors.

### 3. Spender Contract Verification (Weight: 20%)

Whether the approved spender is a verified contract affects trust level.

**Scoring:**
- Unverified contract: +20 points
- EOA (externally owned account): +15 points
- Verified but uncommon: +10 points
- Verified and well-known: +0 points

**Why it matters:** Unverified contracts could contain malicious code.

### 4. Token Value (Weight: 15%)

The USD value of approved tokens affects the potential loss.

**Scoring:**
- High value (>$10,000): +15 points
- Medium value ($1,000-$10,000): +10 points
- Low value ($100-$1,000): +5 points
- Minimal value (<$100): +0 points

**Why it matters:** Higher value approvals have more to lose.

### 5. Historical Risk Indicators (Weight: 10%)

Past incidents or known issues with the spender.

**Scoring:**
- Known exploited contract: +10 points
- Associated with suspicious activity: +7 points
- No known issues: +0 points

**Why it matters:** Previous security incidents indicate potential ongoing risk.

## Calculation Example

```typescript
import { calculateRiskScore } from 'approval-guard';

const approval = {
  token: '0x...',
  spender: '0x...',
  allowance: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
  lastUsed: new Date('2022-01-01'),
  spenderVerified: false,
  tokenValueUsd: 5000
};

// Risk calculation:
// Unlimited allowance: +30
// Dormant (365+ days): +25
// Unverified spender: +20
// Medium value: +10
// No historical issues: +0
// Total: 85 (Critical)
```

## Custom Risk Thresholds

You can customize risk thresholds via configuration:

```typescript
// src/config.ts or CLI arguments
const config = {
  riskThresholds: {
    critical: 80,
    high: 60,
    medium: 40,
    low: 20
  },
  riskWeights: {
    unlimitedAllowance: 0.30,
    dormantApproval: 0.25,
    spenderVerification: 0.20,
    tokenValue: 0.15,
    historicalRisk: 0.10
  }
};
```

## Recommendations

Based on risk scores, Approval Guard provides recommendations:

### Critical Risk (80-100)
- **Action:** Revoke immediately
- **Priority:** Urgent
- **Message:** "This approval poses significant risk and should be revoked as soon as possible."

### High Risk (60-79)
- **Action:** Consider revoking
- **Priority:** High
- **Message:** "This approval should be reviewed and likely revoked unless actively needed."

### Medium Risk (40-59)
- **Action:** Monitor
- **Priority:** Medium
- **Message:** "Keep an eye on this approval. Consider revoking if no longer needed."

### Low Risk (20-39)
- **Action:** No immediate action
- **Priority:** Low
- **Message:** "This approval is relatively safe but should still be periodically reviewed."

### Minimal Risk (0-19)
- **Action:** None required
- **Priority:** Informational
- **Message:** "This approval appears safe."

## API Usage

```typescript
import { RiskScorer, RiskLevel } from 'approval-guard';

const scorer = new RiskScorer();

// Score a single approval
const score = scorer.calculateScore(approval);
console.log(`Score: ${score.value}, Level: ${score.level}`);

// Get detailed breakdown
const breakdown = scorer.getScoreBreakdown(approval);
console.log(breakdown);
// {
//   unlimitedAllowance: { score: 30, reason: 'Unlimited approval detected' },
//   dormantApproval: { score: 25, reason: 'No activity in 400 days' },
//   ...
// }

// Filter by risk level
const criticalApprovals = approvals.filter(
  a => scorer.calculateScore(a).level === RiskLevel.CRITICAL
);
```

## Best Practices

1. **Regular Scanning:** Scan your wallet at least monthly
2. **Revoke Unused:** Revoke approvals you no longer need
3. **Limit Allowances:** When possible, approve only the amount needed
4. **Verify Spenders:** Only approve verified, trusted contracts
5. **Track History:** Use the history feature to monitor changes over time
