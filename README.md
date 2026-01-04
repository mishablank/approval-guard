# 🛡️ Approval Guard
### Web3 Security & Wallet Safety Utility

Approval Guard is a **non-custodial web3 security tool** that scans Ethereum & major L2 wallets for ERC-20 token approvals, identifies risky allowances, and helps users understand their **wallet exposure risk** before it becomes a problem.

It focuses on:
- Detecting **unlimited approvals**
- Finding **dormant or forgotten approvals**
- Highlighting approvals to **unknown / untrusted contracts**
- Surfacing **orphan approvals** where tokens are no longer held
- Producing a **clear, human-readable risk report**

---

## 🚀 Key Features

- 🔍 **Wallet Approval Scanner**
  - Reads ERC-20 `allowance()` values
  - Discovers spender contracts and classifies risk

- 🧠 **Risk Intelligence**
  - Risk scoring per approval: Low / Medium / High
  - Global wallet risk rating
  - Looks at age, dormancy, spender popularity, and more

- ⏳ **Time-Bounded History**
  - Default analysis based on recent blockchain activity (30-day optimized window)

- 📄 **Readable Security Report**
  - Outputs JSON or formatted text report
  - Suitable for humans and automated consumption

- 🛡️ **Non-Custodial by Design**
  - No keys, no custody, no trust required
  - Reads public chain data only

---

## ✅ Supported Networks

| Chain | Status |
|-------|--------|
| Ethereum Mainnet | ✅ Supported |
| Arbitrum | ✅ Supported |
| Optimism | ✅ Supported |
| Base | ✅ Supported |

---

## 🏗️ Architecture Overview

Approval Guard runs as a **CLI tool** that performs:

1️⃣ Fetch wallet approvals  
2️⃣ Resolve spender metadata  
3️⃣ Apply risk model  
4️⃣ Produce security report  

Internally it uses:
- RPC providers (Ethereum + L2s)
- Metadata enrichment cache
- Lightweight risk engine

No private data leaves your machine.

---

## ⚙️ Installation

Clone the repo:

```bash
git clone https://github.com/<your-org>/approval-guard.git
cd approval-guard

Install dependencies:
pnpm install

Build:
pnpm build
