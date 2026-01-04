<div align="center">

# 🛡️ Approval Guard  
### Web3 Wallet Security • Risk Visibility • Approval Monitoring

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Security Focus](https://img.shields.io/badge/focus-wallet%20safety-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-ethereum-blueviolet)
![Pull Requests](https://img.shields.io/badge/PRs-welcome-success)
![Contributions](https://img.shields.io/badge/contributions-open-lightgrey)

A powerful **non‑custodial wallet security tool** that scans ERC‑20 approvals,
identifies risk, and helps users understand & reduce wallet exposure.

</div>

---

## ✨ Why Approval Guard?

Crypto users unknowingly leave **dangerous approvals** behind:
- Unlimited approvals that never expired
- Forgotten DeFi approvals
- Malicious contract permissions
- Orphan approvals where tokens no longer exist

Approval Guard gives **clarity, insight, and control** 💪  

---

## 🚀 Features

✔️ Scan ERC‑20 approvals across Ethereum & major L2s  
✔️ Detect unlimited or unusually large allowances  
✔️ Identify unknown or suspicious spender contracts  
✔️ Flag dormant / abandoned approvals  
✔️ Provide a **clear wallet risk score**  
✔️ Export machine‑readable & human‑friendly reports  
✔️ 100% non‑custodial — reads only, never signs  

---

## 🧠 Built for Security

![Security](https://img.shields.io/badge/security-first-critical)
![Non Custodial](https://img.shields.io/badge/non--custodial-yes-green)
![Privacy](https://img.shields.io/badge/privacy-preserving-blue)

Approval Guard:
- Never asks for private keys
- Never triggers transactions automatically
- Never touches user funds
- Only reads on‑chain data

---

## 🌐 Supported Networks

| Chain | Status |
|-------|--------|
| Ethereum Mainnet | ✅ |
| Arbitrum | ✅ |
| Optimism | ✅ |
| Base | ✅ |

More coming soon 👀

---

## 📦 Install

```bash
git clone https://github.com/<your-org>/approval-guard.git
cd approval-guard
pnpm install
pnpm build
```

---

## 🧪 Quick Start

Scan a wallet:
```bash
approval-guard scan 0xYourWallet
```

Pretty / human readable:
```bash
approval-guard scan 0xYourWallet --pretty
```

JSON export:
```bash
approval-guard scan 0xYourWallet --json > report.json
```

---

## 📊 Example Output

```
Scanning wallet 0xABC...

Found 38 approvals
6 high risk ⚠️
12 medium risk
20 low risk

Wallet Risk Score: 62 (Elevated 🚨)
```

---

## 🧱 Architecture

- CLI scanner
- Risk engine
- Metadata enrichment
- Reporting layer

Docs:
- `docs/architecture.md`
- `docs/risk-model.md`

---

## 🔍 Risk Model

Risk considers:
- Unlimited allowance
- Spender trust level
- Dormancy age
- Orphan approvals
- Exposure vs balance

Full risk model here:
```
docs/risk-model.md
```

---

## ⚙️ Environment

Optional RPCs:

```bash
RPC_ETHEREUM_MAINNET=
RPC_ARBITRUM_ONE=
RPC_OPTIMISM=
RPC_BASE=
```

Defaults to public RPCs if not set.

---

## 🗺️ Roadmap

📌 NFT approval scanning  
📌 UI dashboard  
📌 Historical analytics  
📌 Threat intelligence feeds  
📌 Automated revoke helpers  

---

## 🤝 Contributing

We ❤️ developers & security researchers.

- Open Issues
- Submit PRs
- Share insights

Bad code hurts wallets — let's fix it together.

---

## ⚠️ Disclaimer

Approval Guard is a visibility & awareness tool.  
It does **not** guarantee safety.

Always verify before approving / signing anything.

---

## 📜 License

MIT License

---

<div align="center">

Built for safer wallets 🛡️  
Built for real users ❤️  
Built for Web3 🌐

</div>
