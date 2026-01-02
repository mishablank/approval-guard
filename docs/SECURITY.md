# Security Policy

This document outlines the security considerations for Approval Guard and how to report vulnerabilities.

## Security Model

### What Approval Guard Does NOT Do

1. **Never accesses private keys or seed phrases**
   - All operations are read-only
   - No wallet connection required
   - No transaction signing capability

2. **Never transmits data externally**
   - All data stays local
   - No analytics or telemetry
   - No external API calls (except user-specified RPC)

3. **Never modifies blockchain state**
   - Read-only blockchain access
   - Cannot revoke approvals directly
   - Cannot execute transactions

### What Approval Guard Does

1. **Reads public blockchain data**
   - Approval events from ERC-20 contracts
   - Token metadata (name, symbol, decimals)
   - Contract information

2. **Stores data locally**
   - Cache files for performance
   - Generated reports
   - Configuration files

3. **Provides risk assessments**
   - Heuristic-based scoring
   - Recommendations only
   - No automated actions

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability:

### Do NOT

- Open a public GitHub issue
- Discuss on social media
- Share details publicly

### Do

1. Email security@approval-guard.io with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

2. Allow up to 48 hours for initial response

3. Work with us on coordinated disclosure

### What to Expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Credit in release notes (if desired)
- No legal action for good-faith research

## Security Best Practices

### For Users

```bash
# Always install from official sources
npm install -g @approval-guard/cli

# Verify package integrity
npm audit signatures

# Keep updated
npm update -g @approval-guard/cli
```

### RPC Security

```bash
# Use environment variables for RPC URLs
export RPC_URL=https://your-rpc-url
approval-guard scan 0xAddress

# Don't commit RPC URLs with API keys
echo ".env" >> .gitignore
```

### Output Security

```bash
# Be careful with report files
# They contain your wallet's approval history
chmod 600 approval-report.json

# Don't share publicly
# Reports could reveal your DeFi activity
```

## Dependency Security

Approval Guard minimizes dependencies and audits them regularly:

```bash
# Check for vulnerabilities
npm audit

# View dependency tree
npm ls
```

### Key Dependencies

| Package | Purpose | Security Notes |
|---------|---------|----------------|
| viem | Ethereum client | Well-audited, type-safe |
| commander | CLI parsing | Minimal, stable |
| chalk | Terminal colors | No network access |

## Code Security

### Input Validation

All inputs are validated:

```typescript
// Addresses are validated
if (!isValidAddress(address)) {
  throw new ValidationError('Invalid Ethereum address');
}

// RPC URLs are validated
if (!isValidRpcUrl(rpcUrl)) {
  throw new ValidationError('Invalid RPC URL');
}
```

### Error Handling

Sensitive data is never logged:

```typescript
// Good: Log error type
logger.error('RPC connection failed', { network });

// Bad: Never log full URLs with API keys
// logger.error('Failed', { url: rpcUrl }); // DON'T DO THIS
```

## Threat Model

### In Scope

| Threat | Mitigation |
|--------|------------|
| Malicious RPC | User provides trusted RPC |
| Cache poisoning | Cache includes checksums |
| Report tampering | Local files, user responsibility |
| Dependency attack | Regular audits, minimal deps |

### Out of Scope

| Threat | Reason |
|--------|--------|
| Wallet theft | No private key access |
| Transaction manipulation | No tx capability |
| On-chain attacks | Read-only |

## Audit Status

Approval Guard has not undergone a formal security audit. While we follow security best practices, users should:

1. Review the source code
2. Run in isolated environments for sensitive data
3. Verify outputs independently when possible

## Changelog

### Security Updates

- **v1.0.0**: Initial release with security review
- Input validation for all user inputs
- No external data transmission
- Local-only data storage

---

## Contact

- Security issues: security@approval-guard.io
- General questions: GitHub issues
- PGP key: Available on request
