# Frequently Asked Questions

Common questions about Approval Guard and token approvals.

## General Questions

### What is a token approval?

A token approval is a permission you grant to a smart contract (like a DEX or DeFi protocol) to spend tokens from your wallet. When you approve a token, you're saying "this contract can move X amount of this token on my behalf."

### Why are approvals risky?

Approvals remain active until you explicitly revoke them. If:
- The approved contract gets hacked
- The contract has a vulnerability
- It's a malicious contract

The attacker can drain all approved tokens from your wallet.

### What is an "unlimited" approval?

An unlimited approval (also called MAX_UINT256) gives a contract permission to spend an infinite amount of your tokens. While convenient, this means if the contract is compromised, you could lose all tokens of that type.

### What is a "dormant" approval?

A dormant approval is one you haven't used in a long time (typically 30-90 days). These are risky because:
- You might forget about them
- The approved protocol might have been abandoned or compromised
- Your tokens remain at risk with no benefit

---

## Using Approval Guard

### How does Approval Guard find my approvals?

Approval Guard scans the blockchain for `Approval` events emitted by ERC-20 tokens. It:
1. Finds all approval events for your address
2. Checks if they're still active
3. Analyzes the approved contracts
4. Calculates a risk score

### Does Approval Guard need my private key?

No! Approval Guard only reads public blockchain data. It never needs:
- Your private key
- Your seed phrase
- Any wallet connection

You only provide your public address.

### How is the risk score calculated?

Risk scores (0-100) are based on:

| Factor | Impact |
|--------|--------|
| Unlimited approval amount | +30 |
| High token value | +20 |
| Unverified contract | +15 |
| Long dormancy | +15 |
| Unknown protocol | +10 |
| Multiple token approvals | +10 |

See [RISK-SCORING.md](./RISK-SCORING.md) for full details.

### Which networks are supported?

- Ethereum Mainnet
- Polygon
- Arbitrum
- Optimism
- Base
- BSC (Binance Smart Chain)
- And any EVM-compatible chain with a custom RPC

### Can Approval Guard revoke approvals for me?

Not directly. Approval Guard provides:
- A list of risky approvals
- Recommended actions
- Links to revocation tools

Actual revocation requires a transaction signed by your wallet.

---

## Risk Assessment

### What's a "safe" risk score?

| Score | Rating | Action |
|-------|--------|--------|
| 0-25 | Low | Generally safe |
| 26-50 | Medium | Review periodically |
| 51-75 | High | Consider revoking |
| 76-100 | Critical | Revoke immediately |

### Should I revoke all approvals?

Not necessarily. Consider:
- **Active approvals** for protocols you use regularly are convenient
- **Limited approvals** (exact amounts) are safer than unlimited
- **High-value tokens** deserve more caution

### Are all unlimited approvals bad?

Not all, but they carry more risk. Trusted, audited protocols with unlimited approvals are safer than unknown contracts. However, even trusted protocols can be hacked.

### What about NFT approvals?

Approval Guard currently focuses on ERC-20 tokens. NFT approvals (ERC-721, ERC-1155) have similar risks but use different approval mechanisms.

---

## Technical Questions

### Why do I need an RPC URL?

Approval Guard reads blockchain data through RPC (Remote Procedure Call) endpoints. Options:
- **Public RPCs**: Free but rate-limited
- **Alchemy/Infura**: Better performance with API key
- **Own node**: Full control

### How accurate is the data?

Approval Guard reads directly from the blockchain, so approval data is 100% accurate. Risk scoring is heuristic and may not capture all risk factors.

### Does scanning cost gas?

No! Scanning only reads data (no transactions). You only pay gas if you decide to revoke approvals.

### How long does a scan take?

Depends on:
- Number of approvals
- RPC speed
- Network congestion

Typically:
- Simple wallet: 10-30 seconds
- DeFi power user: 1-3 minutes
- Very active wallet: 5-10 minutes

### Can I use Approval Guard programmatically?

Yes! Install as a library:

```typescript
import { ApprovalScanner, RiskScorer } from 'approval-guard';

const scanner = new ApprovalScanner({ rpcUrl: '...' });
const approvals = await scanner.scan('0x...');
const risks = RiskScorer.analyze(approvals);
```

See [API.md](./API.md) for full documentation.

---

## Privacy & Security

### Is my data stored anywhere?

Approval Guard stores data locally only:
- Cache files (optional, in `~/.approval-guard/cache`)
- Generated reports (where you specify)

No data is sent to external servers.

### Is Approval Guard open source?

Yes! Full source code is available at:
https://github.com/your-org/approval-guard

### How do I verify I'm using the real Approval Guard?

1. Install from official npm:
   ```bash
   npm install -g @approval-guard/cli
   ```

2. Verify package signature:
   ```bash
   npm audit signatures
   ```

3. Check the source on GitHub

---

## Best Practices

### How often should I scan my wallet?

- After interacting with new protocols
- Monthly for active DeFi users
- Before trading high-value tokens

### What should I do after getting a report?

1. Review all HIGH and CRITICAL risks
2. Decide which protocols you still use
3. Revoke unused/high-risk approvals
4. Consider setting limits on active approvals

### How can I approve tokens more safely?

1. **Use exact amounts** instead of unlimited
2. **Revoke after use** if one-time interaction
3. **Verify contracts** on Etherscan before approving
4. **Use a hardware wallet** for large holdings

---

## Still Have Questions?

- Check [Troubleshooting](./TROUBLESHOOTING.md)
- Open a [GitHub issue](https://github.com/your-org/approval-guard/issues)
- Join our [Discord community](https://discord.gg/approval-guard)
