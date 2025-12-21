# approval-guard

A CLI utility that scans Ethereum wallet token approvals and outputs a risk assessment report. Helps identify risky or unlimited ERC-20 token approvals that could put your assets at risk.

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/approval-guard.git
cd approval-guard

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Basic scan

```bash
# Scan a wallet address
npm start -- scan -a 0xYourWalletAddress

# Or use the built CLI directly
node dist/index.js scan -a 0xYourWalletAddress
```

### With custom RPC endpoint

```bash
npm start -- scan -a 0xYourWalletAddress -r https://your-rpc-endpoint.com
```

### Save report to file

```bash
npm start -- scan -a 0xYourWalletAddress -o report.json
```

### Development mode

```bash
npm run dev -- scan -a 0xYourWalletAddress
```

## Output

The tool generates a JSON report containing:

- **Overall Risk Score**: 0-100 score based on all approvals
- **Individual Approvals**: Each approval with risk assessment
- **Recommendations**: List of approvals to revoke or review

### Example output

```json
{
  "walletAddress": "0x...",
  "overallRiskScore": 65,
  "totalApprovals": 5,
  "highRiskCount": 2,
  "summary": {
    "revokeImmediately": ["USDC -> 0x..."],
    "reviewSoon": ["WETH -> 0x..."]
  }
}
```

## Risk Scoring

| Factor | Points |
|--------|--------|
| Unlimited approval | +50 |
| Very large amount | +25 |
| Known risky spender | +40 |
| Unverified spender | +10 |

## License

MIT
