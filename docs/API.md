# Approval Guard API Documentation

## Overview

Approval Guard is a CLI utility that scans Ethereum wallet token approvals and generates risk assessment reports. This document covers the programmatic API for integrating Approval Guard into your applications.

## Installation

```bash
npm install approval-guard
```

## Quick Start

```typescript
import { ApprovalScanner, RiskCalculator, ReportGenerator } from 'approval-guard';

// Initialize scanner with RPC endpoint
const scanner = new ApprovalScanner({
  rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY'
});

// Scan wallet for approvals
const approvals = await scanner.scanWallet('0x...');

// Calculate risk scores
const riskCalculator = new RiskCalculator();
const scoredApprovals = approvals.map(a => ({
  ...a,
  riskScore: riskCalculator.calculateScore(a)
}));

// Generate report
const generator = new ReportGenerator();
const report = generator.generateReport(scoredApprovals, '0x...');
```

## Core Components

### ApprovalScanner

The main scanner class for fetching token approvals.

#### Constructor Options

```typescript
interface ScannerOptions {
  rpcUrl: string;           // Ethereum RPC endpoint
  batchSize?: number;       // Batch size for requests (default: 100)
  timeout?: number;         // Request timeout in ms (default: 30000)
  retryAttempts?: number;   // Number of retry attempts (default: 3)
}
```

#### Methods

##### `scanWallet(address: string): Promise<Approval[]>`

Scans a wallet address for all ERC-20 token approvals.

```typescript
const approvals = await scanner.scanWallet('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1');
```

##### `scanWalletForToken(walletAddress: string, tokenAddress: string): Promise<Approval | null>`

Scans for a specific token approval.

```typescript
const approval = await scanner.scanWalletForToken(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC
);
```

### RiskCalculator

Calculates risk scores for token approvals.

#### Methods

##### `calculateScore(approval: Approval): RiskScore`

Calculates a comprehensive risk score for an approval.

```typescript
const riskScore = riskCalculator.calculateScore(approval);
console.log(riskScore.score); // 0-100
console.log(riskScore.level); // 'low' | 'medium' | 'high' | 'critical'
console.log(riskScore.factors); // Array of risk factors
```

##### `calculateBatchScores(approvals: Approval[]): RiskScore[]`

Calculates risk scores for multiple approvals efficiently.

```typescript
const scores = riskCalculator.calculateBatchScores(approvals);
```

### ReportGenerator

Generates structured reports from analyzed approvals.

#### Methods

##### `generateReport(approvals: ScoredApproval[], walletAddress: string): Report`

Generates a complete JSON report.

```typescript
const report = generator.generateReport(scoredApprovals, walletAddress);
```

##### `generateSummary(report: Report): ReportSummary`

Generates a condensed summary of the report.

```typescript
const summary = generator.generateSummary(report);
console.log(summary.totalApprovals);
console.log(summary.criticalRiskCount);
console.log(summary.recommendedRevocations);
```

## Types

### Approval

```typescript
interface Approval {
  tokenAddress: Address;
  tokenName: string;
  tokenSymbol: string;
  spenderAddress: Address;
  spenderName?: string;
  allowance: bigint;
  isUnlimited: boolean;
  lastUpdated: Date;
  transactionHash: Hash;
}
```

### RiskScore

```typescript
interface RiskScore {
  score: number;           // 0-100
  level: RiskLevel;        // 'low' | 'medium' | 'high' | 'critical'
  factors: RiskFactor[];   // Contributing factors
  recommendation: string;  // Action recommendation
}
```

### RiskFactor

```typescript
interface RiskFactor {
  type: RiskFactorType;
  weight: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}
```

### Report

```typescript
interface Report {
  walletAddress: Address;
  scanDate: Date;
  networkId: number;
  approvals: ScoredApproval[];
  summary: ReportSummary;
  recommendations: Recommendation[];
}
```

## Risk Factors

Approval Guard evaluates the following risk factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| `UNLIMITED_ALLOWANCE` | 30 | Approval has unlimited (max uint256) allowance |
| `DORMANT_APPROVAL` | 20 | Approval hasn't been used in 90+ days |
| `UNKNOWN_SPENDER` | 25 | Spender contract is not verified or recognized |
| `HIGH_VALUE_TOKEN` | 15 | Token has significant USD value |
| `DEPRECATED_PROTOCOL` | 35 | Spender belongs to a deprecated protocol |
| `BLACKLISTED_SPENDER` | 50 | Spender is on known malicious address list |

## Error Handling

```typescript
import { 
  ApprovalGuardError, 
  ValidationError, 
  NetworkError 
} from 'approval-guard';

try {
  const approvals = await scanner.scanWallet(address);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof ApprovalGuardError) {
    console.error('Approval Guard error:', error.message);
  }
}
```

## Configuration

### Environment Variables

```bash
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
CACHE_TTL=3600
BATCH_SIZE=100
MAX_RETRIES=3
```

### Programmatic Configuration

```typescript
import { configure } from 'approval-guard';

configure({
  rpcUrl: process.env.RPC_URL,
  cacheTtl: 3600,
  batchSize: 100,
  maxRetries: 3
});
```

## Best Practices

1. **Use caching**: Enable caching for repeated scans to reduce RPC calls
2. **Handle rate limits**: Configure appropriate batch sizes for your RPC provider
3. **Validate addresses**: Always validate wallet addresses before scanning
4. **Regular scans**: Schedule regular scans to catch new risky approvals

## See Also

- [CLI Usage Guide](./CLI.md)
- [Examples](./examples/)
- [Contributing Guide](../CONTRIBUTING.md)
