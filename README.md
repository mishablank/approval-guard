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
```

Install dependencies:
```pnpm install```

Build:
```pnpm build```

Run a scan:
```approval-guard scan 0xYourWalletAddress```

Example output:

```
Scanning wallet: 0xABC...

Found 38 approvals
6 high risk ⚠️
12 medium risk
20 low risk

Global Wallet Risk Score: 62 (⚠️ Elevated)
```

🔍 What Does “Risk” Mean?

Approval Guard uses a deterministic scoring engine.

High Risk (🔴)

Unlimited approval to unknown / suspicious contract

Very old approval + never revoked

Token no longer held but approval remains

Dormant > 1 year and not a major protocol

Medium Risk (🟡)

Unlimited approval to known protocol

Dormant 3–12 months

Approval significantly higher than wallet balance

Low Risk (🟢)

Recently used approvals

Known trusted protocols

Low allowance caps

The exact heuristic & model are documented in docs/risk-model.md


🧰 CLI Usage Reference
```approval-guard scan <address> [options]```


Options:

Flag	Description
--json	Output structured JSON
--pretty	Human-friendly text output
--chains	Comma separated chain IDs
--no-cache	Disable metadata cache
--debug	Verbose logs

Example:

```approval-guard scan 0x123... --chains 1,42161 --pretty```

🌐 Environment Variables

Approval Guard can optionally use RPC endpoints:
```
RPC_ETHEREUM_MAINNET=
RPC_ARBITRUM_ONE=
RPC_OPTIMISM=
RPC_BASE=
```
Without setting them, it defaults to public RPCs (slower).

🧱 Project Structure
approval-guard
│
├─ src/
│  ├─ cli/          → CLI entry + commands
│  ├─ scanner/      → chain + allowance reader
│  ├─ risk/         → risk engine logic
│  ├─ cache/        → metadata + spender cache
│  └─ report/       → output formatting
│
├─ docs/
│  ├─ architecture.md
│  └─ risk-model.md
│
└─ README.md

🧠 Philosophy

Approval Guard is built with the belief that:

Wallet safety should be accessible
UX & clarity matter more than noise
Real security means empowering users with information
This is not a fear tool — it is a visibility tool.

🤝 Contributing

PRs welcome!

Follow security-first engineering practices

Keep code readable + documented

No fear-mongering UX

⚠️ Disclaimer

Approval Guard is a security awareness tool.
It helps users understand exposure risks — it does not guarantee safety.

Always verify before revoking, signing, or approving transactions.
