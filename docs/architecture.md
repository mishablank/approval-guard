# 🏗️ Approval Guard — Architecture
### System Design, Components, and Data Flow

Approval Guard is designed as a **modular, secure, non-custodial wallet safety system**
that scans ERC‑20 token approvals across Ethereum and major L2 networks, evaluates risk,
and produces actionable intelligence for users.

Architecture goals:

- 🛡️ Security‑first
- 🧠 Deterministic and explainable behavior
- ⚙️ Maintainable modular design
- ⚡ Fast execution with minimal RPC overhead
- 🧾 Clear auditing and observability

---

## 🔍 High‑Level Overview

Approval Guard consists of three key subsystems:

1️⃣ **Scanner Engine**
- Reads on‑chain ERC‑20 approvals
- Discovers spender contracts
- Collects contextual metadata

2️⃣ **Risk Engine**
- Evaluates risk using deterministic scoring rules
- Classifies severity (Low / Medium / High)
- Computes global wallet health score

3️⃣ **Report Layer**
- Outputs structured JSON data
- Provides human‑readable risk summaries
- Supports CLI and UI formats

---

## 🧱 Core Components

```
approval-guard
│
├─ cli/              → User interface entry (commands + flags)
├─ scanner/          → On‑chain reader and discovery engine
├─ risk/             → Risk scoring + severity logic
├─ cache/            → Metadata + spender info caching
└─ report/           → Report builders + formatters
```

Each layer is isolated and testable.

---

## 🌐 Supported Networks

- Ethereum Mainnet
- Arbitrum
- Optimism
- Base

All chains use configurable RPC endpoints.

---

## 🔄 Data Flow

```
User Wallet → Scanner → Cache Lookup → Chain Queries
          → Risk Engine → Report Generator → Output
```

### Step‑by‑step:

1️⃣ **User Input**
- CLI receives wallet address + config options
- Validates address and parameters

2️⃣ **Scanner**
- Queries chain for:
  - token approvals (`allowance(owner, spender)`)
  - spender addresses
- May scan recent blocks when needed
- Detects unlimited / capped approvals

3️⃣ **Metadata Layer**
- Resolves:
  - token info
  - spender labeling
  - protocol trust category

4️⃣ **Risk Engine**
- Computes numeric score
- Applies rule‑based model
- Produces:
  - per‑approval score
  - global wallet risk score

5️⃣ **Report Layer**
- Formats final output
- Either:
  - JSON (machine‑readable)
  - Pretty text (human‑readable)

---

## 🗄 Cache & Metadata Strategy

To reduce RPC load and accelerate performance:

- Frequently seen spenders are cached
- Popular protocol labels reused
- Token metadata stored

Cache rules:

- Time‑bound TTL
- Explicit refresh options (`--no-cache`)

This balances accuracy and responsiveness.

---

## 🔐 Security Principles

Approval Guard follows strict safety assumptions:

- Non‑custodial always
- Never stores private keys
- Does not trigger transactions
- Does not modify approvals automatically

Security philosophy:

> Provide insight, not execution control.

---

## ⚙️ Configuration

Environment variables:

- RPC providers per chain
- Debug logging
- Cache toggles

Defaults work, but power users can customize.

---

## 🧪 Testing Strategy

Testing focuses on correctness and stability:

- Scanner accuracy
- Risk scoring consistency
- Output formatting
- Edge cases

Planned test layers:

- Unit tests
- Integration tests
- Known scenario simulations

---

## 🔮 Future Architecture Extensions

Planned areas:

- NFT approval scanning
- Real‑time UI dashboard
- Persistent historical analytics
- Background indexing service
- Security intelligence integrations
- Automated revoke workflows (optional, still non‑custodial)

---

## 🧾 Summary

Approval Guard’s architecture is designed to be:

- Reliable
- Transparent
- Security‑focused
- Developer‑friendly

It prioritizes **clarity, correctness, and user protection**
while remaining flexible for future evolution.

---

## 🤝 Contributions Welcome

Architecture feedback is appreciated.

If you see ways to improve:

- Open a GitHub Issue
- Submit a PR
- Share research insights

Let’s make wallets safer together.
