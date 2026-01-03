# Approval Guard 🛡️

[![npm version](https://img.shields.io/npm/v/approval-guard.svg)](https://www.npmjs.com/package/approval-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A powerful CLI utility that scans Ethereum wallet token approvals and outputs comprehensive risk assessment reports.

## ✨ Features

- 🔍 **Comprehensive Scanning** - Scan any wallet for all ERC-20 token approvals
- ⚠️ **Risk Assessment** - Calculate risk scores for unlimited and dormant approvals
- 📊 **Detailed Reports** - Generate JSON reports with actionable revocation recommendations
- 🚀 **Fast & Efficient** - Batch processing and caching for optimal performance
- 🔒 **Security Focused** - Built with security best practices

## 📦 Installation

```bash
# Using npm
npm install -g approval-guard

# Using yarn
yarn global add approval-guard

# Using pnpm
pnpm add -g approval-guard
```

## 🚀 Quick Start

```bash
# Scan a wallet address
approval-guard scan 0x742d35Cc6634C0532925a3b844Bc9e7595f1E2B1

# Generate a JSON report
approval-guard scan 0x742d35Cc6634C0532925a3b844Bc9e7595f1E2B1 --format json --output report.json

# Filter high-risk approvals only
approval-guard scan 0x742d35Cc6634C0532925a3b844Bc9e7595f1E2B1 --min-risk high
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [CLI Reference](docs/CLI.md) | Complete command-line interface guide |
| [API Documentation](docs/API.md) | Programmatic usage and API reference |
| [Architecture](docs/ARCHITECTURE.md) | System design and component overview |
| [Risk Scoring](docs/RISK-SCORING.md) | How risk scores are calculated |
| [Security](docs/SECURITY.md) | Security best practices and considerations |
| [FAQ](docs/FAQ.md) | Frequently asked questions |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [Contributing](docs/CONTRIBUTING.md) | How to contribute to the project |

## 💻 Programmatic Usage

```typescript
import { ApprovalScanner, RiskScorer, Reporter } from 'approval-guard';

const scanner = new ApprovalScanner({
  rpcUrl: process.env.RPC_URL,
});

const approvals = await scanner.scan('0x742d35Cc6634C0532925a3b844Bc9e7595f1E2B1');

const scorer = new RiskScorer();
const scoredApprovals = approvals.map(approval => ({
  ...approval,
  risk: scorer.calculateRisk(approval),
}));

const reporter = new Reporter();
const report = reporter.generateReport(scoredApprovals);

console.log(report);
```

## 🎯 Risk Levels

| Level | Score | Description |
|-------|-------|-------------|
| 🟢 Low | 0-30 | Minimal risk, reasonable approval amounts |
| 🟡 Medium | 31-60 | Moderate risk, review recommended |
| 🟠 High | 61-80 | Significant risk, consider revoking |
| 🔴 Critical | 81-100 | Severe risk, immediate action recommended |

## ⚙️ Configuration

Create a `.env` file in your project root:

```env
# Required
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-api-key

# Optional
ETHERSCAN_API_KEY=your-etherscan-api-key
CACHE_TTL=300000
BATCH_SIZE=10
```

See [.env.example](.env.example) for all available options.

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/example/approval-guard.git
cd approval-guard

# Install dependencies
npm install

# Run tests
npm test

# Run in development mode
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](docs/CONTRIBUTING.md) before submitting a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [viem](https://viem.sh/) - TypeScript interface for Ethereum
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [chalk](https://github.com/chalk/chalk) - Terminal styling

## 📬 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/example/approval-guard/issues)
- 💬 [Discussions](https://github.com/example/approval-guard/discussions)

---

<p align="center">
  Made with ❤️ by the Approval Guard team
</p>
