# 🧠 Approval Guard — Risk Model  
### Understanding How Wallet Approval Risk Is Scored

Approval Guard evaluates wallet ERC-20 spending approvals to estimate realistic exposure risk to malicious access, silent drains, or unintended token spending.

Risk scoring is **transparent, deterministic, and explainable**.  
This document describes exactly how the engine evaluates risk.

---

## 🎯 Goals of the Risk Model

Approval Guard focuses on detecting approvals that represent meaningful danger:

- Silent wallet drains  
- Malicious contract rug pulls  
- Forgotten approvals from old protocols  
- Unlimited exposures users intended to be temporary  
- Unnecessary approvals for tokens users no longer hold  

The goal is:

> Reduce wallet blast radius without overwhelming users with false alarms.

This is a **decision-support model**, not a fear engine.

---

## ✔️ Supported Asset Type

Currently supported:

- ERC-20 approvals via `allowance(owner, spender)`

Planned:

- ERC-721 `setApprovalForAll`  
- ERC-1155 `setApprovalForAll`

---

## 🧮 Risk Scoring Overview

Every approval receives a **numeric score (0–100)**.  
Higher = more dangerous.

Severity mapping:

| Score Range | Label | Meaning |
|------------:|--------|---------|
| 0–30 | 🟢 Low | Likely safe / expected approval |
| 31–60 | 🟡 Medium | Worth reviewing |
| 61–100 | 🔴 High | Action strongly recommended |

---

## 📊 Factors Considered

---

### 1️⃣ Unlimited vs. Capped Allowance

Approval Guard detects whether an allowance is effectively unlimited (`uint256.max`) or disproportionately large.

**Scoring**

- Unlimited → `+30`
- Extremely large but not max → `+10–20`

---

### 2️⃣ Spender Trust Profile

Approval Guard classifies spenders:

| Category | Description |
|----------|-------------|
| Known Trusted Protocol | Major DEX / lending |
| Medium Risk Protocol | Bridges / newer protocols |
| Unknown Contract | No metadata |
| Suspicious / Flagged | Known malicious |
| Deprecated / Abandoned | No recent activity |

**Scoring**

- Unknown → `+25`  
- Suspicious → `+40`  
- Rarely seen → `+15`  
- Popular & verified → `−15` discount

Popularity heuristic:  
> More wallets approving a spender = lower likelihood of rug behavior.

---

### 3️⃣ Dormancy (Last Activity)

Forgotten approvals are dangerous.

| Dormancy | Meaning | Score |
|----------|---------|--------|
| < 30 days | Recently used | +0 |
| 30–90 days | Mild concern | +10 |
| 90–365 days | Stale | +20 |
| > 1 year | 🚨 High concern | +30 |

---

### 4️⃣ Orphan Approvals (Token Not Held)

If user no longer owns a token but approval exists:

- Future incoming tokens automatically exposed  
- Users often forget approval exists  

**Scoring**

- No balance + approval → `+20`
- Illiquid / obscure token → `+10`

---

### 5️⃣ Relative Exposure vs Balance

Allowance relative to balance:

- Allowance >> balance → lower immediate risk  
- Allowance ≈ balance → meaningful risk  

**Scoring**

- `allowance >= balance * 10` → +0  
- `allowance >= balance * 2` → +10  
- `allowance ≈ balance` → +20  

---

### 6️⃣ Protocol Metadata Signals

Optional enrichment:

- Contract verified?
- Appears in exploit databases?
- Proxy redeployed recently?

**Scoring**

- Verified contract → `−10`  
- Known malicious → `+40`  
- Suspicious upgrades → `+15`

---

## 🧮 Simplified Logic (Readable)

```
base = 20

if unlimited                   +30
if unknown spender             +25
if suspicious spender          +40
if dormant > 90 days           +20
if dormant > 365 days          +30
if no token held               +20
if allowance ≈ balance         +20
if popular trusted protocol    -15

cap result between 0–100
```

Severity mapping:

```
0–30   → Low (🟢)
31–60  → Medium (🟡)
61–100 → High (🔴)
```

---

## 🧪 Why This Model?

Optimized for:

- Signal > noise  
- Explainable results  
- Real-world wallet safety  
- Minimizing catastrophic loss scenarios  

Not a fear engine.  
A **clarity engine**.

---

## ⚠️ Limitations

- Blockchain activity ≠ human intent  
- Risk model is probabilistic  
- Some approvals may be:
  - Required for convenience  
  - Contractual necessity  
  - Harmless edge-cases  

Approval Guard:

- Never auto-revokes  
- Never controls your wallet  
- Does not replace judgment  

It is a **visibility + awareness tool**.

---

## 🗺️ Future Enhancements

- ERC-721 / ERC-1155 support  
- Real-time exploit intelligence feeds  
- Machine-learned spender classification  
- Wallet health trend analytics  

---

## 📌 Summary

Approval Guard helps users understand:

- What approvals exist  
- Which ones are dangerous  
- What deserves attention  

If something is **🔴 High Risk**, it is likely:

- Forgotten  
- Oversized  
- Unnecessary  
- Or dangerous  

Revoking improves wallet resilience.

---

## 🤝 Feedback

Security researchers and contributors welcome.

Open an issue or PR — thoughtful critique appreciated.
