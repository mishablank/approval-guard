import { TokenApproval, ApprovalRisk, RiskReport, MAX_UINT256 } from './types';

/** Known risky or deprecated spender addresses */
const KNOWN_RISKY_SPENDERS = new Set([
	// Add known compromised or deprecated contract addresses here
]);

/**
 * Calculates risk score for a single approval
 * @param approval - The token approval to assess
 * @returns Risk assessment with score and factors
 */
export function calculateRisk(approval: TokenApproval): ApprovalRisk {
	let riskScore = 0;
	const riskFactors: string[] = [];

	// Unlimited approval: +50 points
	if (approval.isUnlimited) {
		riskScore += 50;
		riskFactors.push('Unlimited approval amount');
	}

	// Large but not unlimited: +25 points
	const largeThreshold = BigInt('1000000000000000000000000'); // 1M tokens (18 decimals)
	if (!approval.isUnlimited && approval.allowance > largeThreshold) {
		riskScore += 25;
		riskFactors.push('Very large approval amount');
	}

	// Known risky spender: +40 points
	if (KNOWN_RISKY_SPENDERS.has(approval.spenderAddress.toLowerCase())) {
		riskScore += 40;
		riskFactors.push('Known risky or deprecated spender');
	}

	// Unverified/unknown spender (not a well-known protocol): +10 points
	// In production, this would check against a whitelist of known protocols
	riskScore += 10;
	riskFactors.push('Spender contract not in verified whitelist');

	// Cap score at 100
	riskScore = Math.min(riskScore, 100);

	// Determine recommendation
	let recommendation: 'revoke' | 'review' | 'safe';
	if (riskScore >= 60) {
		recommendation = 'revoke';
	} else if (riskScore >= 30) {
		recommendation = 'review';
	} else {
		recommendation = 'safe';
	}

	return {
		approval,
		riskScore,
		riskFactors,
		recommendation,
	};
}

/**
 * Generates a complete risk assessment report
 * @param walletAddress - The scanned wallet address
 * @param approvals - Array of token approvals found
 * @returns Complete risk report with recommendations
 */
export function generateReport(
	walletAddress: string,
	approvals: TokenApproval[]
): RiskReport {
	const assessedApprovals = approvals.map(calculateRisk);

	// Calculate overall risk score (weighted average)
	const overallRiskScore = assessedApprovals.length > 0
		? Math.round(
				assessedApprovals.reduce((sum, a) => sum + a.riskScore, 0) / 
				assessedApprovals.length
			)
		: 0;

	// Count high risk approvals
	const highRiskCount = assessedApprovals.filter(a => a.riskScore >= 60).length;

	// Build summary
	const revokeImmediately = assessedApprovals
		.filter(a => a.recommendation === 'revoke')
		.map(a => `${a.approval.tokenSymbol || a.approval.tokenAddress} -> ${a.approval.spenderAddress}`);

	const reviewSoon = assessedApprovals
		.filter(a => a.recommendation === 'review')
		.map(a => `${a.approval.tokenSymbol || a.approval.tokenAddress} -> ${a.approval.spenderAddress}`);

	// Convert bigints to strings for JSON serialization
	const serializableApprovals = assessedApprovals.map(a => ({
		...a,
		approval: {
			...a.approval,
			allowance: a.approval.allowance.toString(),
			blockNumber: a.approval.blockNumber.toString(),
		},
	}));

	return {
		walletAddress,
		scanTimestamp: new Date().toISOString(),
		overallRiskScore,
		totalApprovals: approvals.length,
		highRiskCount,
		approvals: serializableApprovals as unknown as ApprovalRisk[],
		summary: {
			revokeImmediately,
			reviewSoon,
		},
	};
}
