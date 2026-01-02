# Approval Guard Architecture

This document describes the high-level architecture of Approval Guard and how its components interact.

## Overview

Approval Guard is designed with a modular architecture that separates concerns into distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│                        (src/cli.ts)                         │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  Approval   │ │    Risk     │ │   Report Generator  │   │
│  │   Service   │ │  Analysis   │ │                     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                       Core Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Scanner   │ │ Risk Scorer │ │     Reporter        │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     Utility Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │    Cache    │ │  Batch Proc │ │    Validation       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components

### CLI Layer

The entry point for user interaction. Handles:
- Command-line argument parsing
- User input validation
- Output formatting
- Error presentation

**Key File:** `src/cli.ts`

### Service Layer

Orchestrates business logic and coordinates between core components.

#### Approval Service (`src/services/approval-service.ts`)
- Fetches token approvals from the blockchain
- Manages approval data retrieval
- Coordinates with the scanner

#### Risk Analysis Service (`src/services/risk-analysis-service.ts`)
- Analyzes approvals for potential risks
- Aggregates risk scores
- Provides recommendations

#### Report Generator (`src/services/report-generator.ts`)
- Generates structured reports
- Supports multiple output formats (JSON, text)
- Includes summary statistics

#### Revocation Service (`src/services/revocation-service.ts`)
- Prepares revocation transactions
- Estimates gas costs
- Provides revocation guidance

### Core Layer

#### Scanner (`src/scanner.ts`)
- Interfaces with Ethereum nodes via viem
- Scans for ERC-20 approval events
- Extracts approval data from logs

#### Risk Scorer (`src/risk-scorer.ts`)
- Calculates risk scores for individual approvals
- Applies weighted risk factors
- Categorizes risk levels

#### Reporter (`src/reporter.ts`)
- Formats output data
- Generates human-readable reports
- Structures JSON output

### Utility Layer

#### Cache (`src/cache/`)
- Caches approval data to reduce RPC calls
- Implements TTL-based expiration
- Supports memory-based storage

#### Batch Processor (`src/utils/batch-processor.ts`)
- Handles concurrent operations with rate limiting
- Manages batch sizes for optimal performance
- Provides retry logic

#### Validation (`src/utils/validation.ts`)
- Validates addresses, amounts, and configurations
- Provides type guards
- Ensures data integrity

## Data Flow

### Scanning Flow

```
User Input → CLI → ApprovalService → Scanner → Blockchain
                                         ↓
                                    Cache (store)
                                         ↓
                                    Raw Approvals
```

### Analysis Flow

```
Raw Approvals → RiskAnalysisService → RiskScorer
                                          ↓
                                    Risk Factors
                                          ↓
                                    Scored Approvals
```

### Reporting Flow

```
Scored Approvals → ReportGenerator → Reporter
                                         ↓
                                    Formatted Report
                                         ↓
                                    CLI Output
```

## Error Handling

The application uses a hierarchical error system:

```
ApprovalGuardError (base)
├── ValidationError
├── NetworkError
└── (future error types)
```

All errors are processed through the central error handler (`src/errors/error-handler.ts`) which:
- Logs errors appropriately
- Formats user-friendly messages
- Handles recovery where possible

## Configuration

Configuration is managed through:
- Environment variables (`.env`)
- CLI arguments (runtime overrides)
- Default values (`src/config.ts`)

Priority: CLI args > Environment variables > Defaults

## Extensibility

### Adding New Risk Factors

1. Define the factor in `src/risk/risk-factors.ts`
2. Implement calculation logic in `src/risk/risk-calculator.ts`
3. Add tests in `tests/risk-scorer.test.ts`

### Adding New Output Formats

1. Add format type to `src/types.ts`
2. Implement formatter in `src/services/report-generator.ts`
3. Add CLI option in `src/cli.ts`

### Supporting New Token Standards

1. Add scanner logic in `src/scanner.ts`
2. Define types in `src/types.ts`
3. Update risk scoring for standard-specific risks
