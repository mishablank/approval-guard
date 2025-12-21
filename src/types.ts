/**
 * Represents a single ERC-20 token approval
 */
export interface TokenApproval {
	/** Token contract address */
	tokenAddress: string;
	/** Token symbol if available */
	tokenSymbol?: string;
	/** Spender address that has approval */
	spenderAddress: string;
	/** Approved amount in wei */
	allowance: bigint;
	/** Whether this is an unlimited approval */
	isUnlimited: boolean;
	/** Block number when approval was set */
	blockNumber: bigint;
	/** Timestamp of the approval (if available) */
	timestamp?: number;
}

/**
 * Risk assessment for a single approval
 */
export interface ApprovalRisk {
	approval: TokenApproval;
	/** Risk score from 0-100 */
	riskScore: number;
	/** Risk factors identified */
	riskFactors: string[];
	/** Recommended action */
	recommendation: 'revoke' | 'review' | 'safe';
}

/**
 * Complete risk assessment report
 */
export interface RiskReport {
	/** Wallet address scanned */
	walletAddress: string;
	/** Timestamp of the scan */
	scanTimestamp: string;
	/** Overall risk score 0-100 */
	overallRiskScore: number;
	/** Total number of approvals found */
	totalApprovals: number;
	/** Count of high risk approvals */
	highRiskCount: number;
	/** Individual approval assessments */
	approvals: ApprovalRisk[];
	/** Summary of recommendations */
	summary: {
		revokeImmediately: string[];
		reviewSoon: string[];
	};
}

/**
 * ERC-20 Approval event signature
 */
export const APPROVAL_EVENT_SIGNATURE = 
	'0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';

/** Maximum uint256 value - indicates unlimited approval */
export const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
