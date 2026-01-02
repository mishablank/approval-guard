# Troubleshooting Guide

This guide covers common issues and their solutions when using Approval Guard.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Connection Problems](#connection-problems)
- [Scanning Issues](#scanning-issues)
- [Performance Problems](#performance-problems)
- [Output Issues](#output-issues)

---

## Installation Issues

### "Cannot find module 'viem'" Error

**Problem:** Dependencies are not properly installed.

**Solution:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Or with yarn
rm -rf node_modules
yarn install
```

### TypeScript Compilation Errors

**Problem:** TypeScript version mismatch or missing types.

**Solution:**
```bash
# Ensure TypeScript is installed
npm install -D typescript@^5.0.0

# Rebuild the project
npm run build
```

### Node.js Version Issues

**Problem:** Approval Guard requires Node.js 18 or higher.

**Solution:**
```bash
# Check your Node version
node --version

# Use nvm to install correct version
nvm install 18
nvm use 18
```

---

## Connection Problems

### "RPC URL is required" Error

**Problem:** No RPC endpoint configured.

**Solution:**

1. Create a `.env` file in the project root:
```env
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

2. Or pass it via CLI:
```bash
approval-guard scan --rpc https://your-rpc-url 0xYourAddress
```

### Rate Limiting (429 Errors)

**Problem:** Too many requests to the RPC provider.

**Solution:**
```bash
# Increase delay between batches
approval-guard scan --batch-delay 500 0xYourAddress

# Reduce batch size
approval-guard scan --batch-size 5 0xYourAddress
```

**Pro tip:** Use a paid RPC provider for higher rate limits.

### Connection Timeout

**Problem:** RPC endpoint is slow or unresponsive.

**Solution:**
1. Try a different RPC provider
2. Check your internet connection
3. Increase timeout settings:
```typescript
import { createPublicClient, http } from 'viem';

const client = createPublicClient({
  transport: http(rpcUrl, {
    timeout: 60_000, // 60 seconds
  }),
});
```

---

## Scanning Issues

### "Invalid Address" Error

**Problem:** The wallet address format is incorrect.

**Solution:**
- Ensure address starts with `0x`
- Verify it's exactly 42 characters
- Check for copy/paste errors

```bash
# Correct format
approval-guard scan 0x742d35Cc6634C0532925a3b844Bc9e7595f19FCa
```

### No Approvals Found

**Problem:** Scanner returns empty results.

**Possible causes:**
1. Wallet has no ERC-20 approvals
2. Wrong network selected
3. RPC endpoint doesn't support `eth_getLogs`

**Solution:**
```bash
# Verify on the correct network
approval-guard scan --network mainnet 0xYourAddress

# Check with a different RPC
approval-guard scan --rpc https://eth.llamarpc.com 0xYourAddress
```

### Incomplete Results

**Problem:** Some approvals are missing from the scan.

**Solution:**
```bash
# Scan from genesis block
approval-guard scan --from-block 0 0xYourAddress

# Clear cache and rescan
approval-guard scan --no-cache 0xYourAddress
```

---

## Performance Problems

### Slow Scanning

**Problem:** Scan takes too long to complete.

**Solution:**
```bash
# Increase batch size (if RPC allows)
approval-guard scan --batch-size 20 0xYourAddress

# Enable caching
approval-guard scan --cache 0xYourAddress

# Limit block range
approval-guard scan --from-block 15000000 0xYourAddress
```

### High Memory Usage

**Problem:** Process uses too much memory.

**Solution:**
```bash
# Reduce batch size
approval-guard scan --batch-size 3 0xYourAddress

# Use streaming output
approval-guard scan --stream 0xYourAddress
```

### Cache Growing Too Large

**Problem:** Cache directory uses excessive disk space.

**Solution:**
```bash
# Clear the cache
approval-guard cache clear

# Set maximum cache age
approval-guard scan --cache-ttl 86400 0xYourAddress  # 24 hours
```

---

## Output Issues

### JSON Parse Errors

**Problem:** Generated report has invalid JSON.

**Solution:**
```bash
# Validate output
approval-guard scan 0xYourAddress --format json | jq .

# Report the issue with debug info
approval-guard scan --debug 0xYourAddress 2> debug.log
```

### Missing Token Information

**Problem:** Token names/symbols show as "Unknown".

**Solution:**
```bash
# Enable metadata fetching
approval-guard scan --fetch-metadata 0xYourAddress

# Use an archive node for historical data
approval-guard scan --rpc https://archive-node-url 0xYourAddress
```

### Report Not Saving

**Problem:** Output file is not created.

**Solution:**
```bash
# Check directory permissions
ls -la ./output

# Specify full output path
approval-guard scan -o /full/path/to/report.json 0xYourAddress

# Create output directory first
mkdir -p ./reports
approval-guard scan -o ./reports/scan.json 0xYourAddress
```

---

## Getting More Help

If your issue isn't covered here:

1. **Check the logs:**
   ```bash
   approval-guard scan --debug 0xYourAddress
   ```

2. **Search existing issues:**
   https://github.com/your-org/approval-guard/issues

3. **Open a new issue** with:
   - Node.js version (`node --version`)
   - Approval Guard version (`approval-guard --version`)
   - Full error message
   - Steps to reproduce
   - Debug log output

4. **Join our Discord** for community support

---

## Debug Mode

Enable debug mode for detailed logging:

```bash
# Via environment variable
DEBUG=approval-guard:* approval-guard scan 0xYourAddress

# Via CLI flag
approval-guard scan --debug 0xYourAddress
```

Debug output includes:
- RPC requests and responses
- Cache hits/misses
- Risk calculation details
- Performance metrics
