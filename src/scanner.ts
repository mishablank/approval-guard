import { createPublicClient, http, parseAbiItem, Address, formatUnits } from 'viem';
import { mainnet } from 'viem/chains';
import { TokenApproval, APPROVAL_EVENT_SIGNATURE, MAX_UINT256 } from './types';

/** ERC-20 ABI for reading token info and allowances */
const erc20Abi = [
	parseAbiItem('function symbol() view returns (string)'),
	parseAbiItem('function allowance(address owner, address spender) view returns (uint256)'),
	parseAbiItem('event Approval(address indexed owner, address indexed spender, uint256 value)'),
] as const;

/**
 * Scans a wallet address for all ERC-20 token approvals
 * @param walletAddress - The wallet address to scan
 * @param rpcUrl - The RPC endpoint URL
 * @returns Array of token approvals found
 */
export async function scanApprovals(
	walletAddress: string,
	rpcUrl: string
): Promise<TokenApproval[]> {
	const client = createPublicClient({
		chain: mainnet,
		transport: http(rpcUrl),
	});

	const address = walletAddress as Address;
	
	// Fetch approval events for this wallet (last ~30 days of blocks)
	const currentBlock = await client.getBlockNumber();
	const fromBlock = currentBlock - BigInt(200000); // Approximately 30 days

	console.log(`Scanning blocks ${fromBlock} to ${currentBlock}...`);

	// Get all Approval events where owner is the wallet
	const logs = await client.getLogs({
		event: parseAbiItem('event Approval(address indexed owner, address indexed spender, uint256 value)'),
		args: {
			owner: address,
		},
		fromBlock,
		toBlock: currentBlock,
	});

	console.log(`Found ${logs.length} approval events`);

	// Track unique token-spender pairs and get current allowances
	const approvalMap = new Map<string, TokenApproval>();

	for (const log of logs) {
		const tokenAddress = log.address;
		const spenderAddress = log.args.spender as string;
		const key = `${tokenAddress}-${spenderAddress}`;

		// Get current allowance (may have changed since event)
		try {
			const allowance = await client.readContract({
				address: tokenAddress,
				abi: erc20Abi,
				functionName: 'allowance',
				args: [address, spenderAddress as Address],
			});

			// Skip if allowance is now zero
			if (allowance === BigInt(0)) continue;

			// Try to get token symbol
			let tokenSymbol: string | undefined;
			try {
				tokenSymbol = await client.readContract({
					address: tokenAddress,
					abi: erc20Abi,
					functionName: 'symbol',
				});
			} catch {
				tokenSymbol = undefined;
			}

			// Check if unlimited approval (>= 50% of max uint256)
			const isUnlimited = allowance >= MAX_UINT256 / BigInt(2);

			approvalMap.set(key, {
				tokenAddress,
				tokenSymbol,
				spenderAddress,
				allowance,
				isUnlimited,
				blockNumber: log.blockNumber,
			});
		} catch (error) {
			// Skip tokens that fail to read (non-standard implementations)
			continue;
		}
	}

	return Array.from(approvalMap.values());
}
