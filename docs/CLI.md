# Approval Guard CLI Usage Guide

## Installation

### Global Installation

```bash
npm install -g approval-guard
```

### Local Installation

```bash
npm install approval-guard
npx approval-guard --help
```

## Basic Usage

### Scan a Wallet

```bash
approval-guard scan 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
```

### Specify RPC Endpoint

```bash
approval-guard scan 0x... --rpc https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### Output to File

```bash
approval-guard scan 0x... --output report.json
```

## Commands

### `scan`

Scans a wallet for token approvals.

```bash
approval-guard scan <wallet-address> [options]
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--rpc` | `-r` | RPC endpoint URL | `$RPC_URL` env var |
| `--output` | `-o` | Output file path | stdout |
| `--format` | `-f` | Output format (json, table, csv) | json |
| `--min-risk` | `-m` | Minimum risk level to report | low |
| `--verbose` | `-v` | Enable verbose logging | false |
| `--no-cache` | | Disable caching | false |

#### Examples

```bash
# Basic scan
approval-guard scan 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1

# Scan with custom RPC and output
approval-guard scan 0x... -r https://eth.llamarpc.com -o report.json

# Show only high-risk approvals in table format
approval-guard scan 0x... --min-risk high --format table

# Verbose output for debugging
approval-guard scan 0x... --verbose
```

### `report`

Generates a detailed report from a previous scan.

```bash
approval-guard report <input-file> [options]
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | stdout |
| `--format` | `-f` | Output format | json |
| `--include-recommendations` | | Include revocation recommendations | true |

### `check`

Quickly checks a specific token approval.

```bash
approval-guard check <wallet-address> <token-address> [spender-address]
```

#### Examples

```bash
# Check USDC approvals for a wallet
approval-guard check 0x... 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48

# Check specific spender approval
approval-guard check 0x... 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
```

## Output Formats

### JSON (default)

```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "scanDate": "2024-01-15T10:30:00Z",
  "summary": {
    "totalApprovals": 15,
    "criticalRisk": 2,
    "highRisk": 3,
    "mediumRisk": 5,
    "lowRisk": 5
  },
  "approvals": [...]
}
```

### Table

```
┌─────────────┬──────────────────┬───────────────┬────────────┬───────────┐
│ Token       │ Spender          │ Allowance     │ Risk Score │ Risk Level│
├─────────────┼──────────────────┼───────────────┼────────────┼───────────┤
│ USDC        │ Uniswap V2       │ Unlimited     │ 45         │ Medium    │
│ WETH        │ Unknown (0x7a..) │ 1000.00       │ 72         │ High      │
│ DAI         │ Aave V3          │ Unlimited     │ 35         │ Medium    │
└─────────────┴──────────────────┴───────────────┴────────────┴───────────┘
```

### CSV

```csv
token,tokenAddress,spender,spenderAddress,allowance,riskScore,riskLevel
USDC,0xA0b8...,Uniswap V2,0x7a25...,unlimited,45,medium
WETH,0xC02a...,Unknown,0x1234...,1000.00,72,high
```

## Environment Variables

```bash
# Required
export RPC_URL="https://eth-mainnet.g.alchemy.com/v2/your-key"

# Optional
export APPROVAL_GUARD_CACHE_DIR="~/.approval-guard/cache"
export APPROVAL_GUARD_LOG_LEVEL="info"
export APPROVAL_GUARD_BATCH_SIZE="100"
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Network error |
| 4 | Critical risk approvals found |

## CI/CD Integration

### GitHub Actions

```yaml
- name: Scan wallet approvals
  run: |
    npx approval-guard scan ${{ secrets.WALLET_ADDRESS }} \
      --rpc ${{ secrets.RPC_URL }} \
      --min-risk high \
      --output approval-report.json

- name: Upload report
  uses: actions/upload-artifact@v3
  with:
    name: approval-report
    path: approval-report.json
```

### Exit on Critical Risk

```bash
approval-guard scan 0x... --min-risk critical
if [ $? -eq 4 ]; then
  echo "Critical risk approvals found!"
  exit 1
fi
```

## Troubleshooting

### Rate Limiting

If you encounter rate limiting, try:

1. Use a dedicated RPC endpoint
2. Reduce batch size: `--batch-size 50`
3. Enable caching: `--cache`

### Invalid Address Error

Ensure the address:
- Is a valid Ethereum address (42 characters, starts with 0x)
- Is checksummed correctly or use lowercase

### Network Timeout

Increase timeout with: `--timeout 60000`

## See Also

- [API Documentation](./API.md)
- [Examples](./examples/)
