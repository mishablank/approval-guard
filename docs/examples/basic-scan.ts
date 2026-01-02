/**
 * Basic Approval Guard Usage Example
 * 
 * This example demonstrates how to scan a wallet for token approvals
 * and generate a risk assessment report.
 */

import {
  ApprovalScanner,
  RiskCalculator,
  ReportGenerator,
  ValidationError,
  NetworkError
} from 'approval-guard';

async function main() {
  // Configuration
  const RPC_URL = process.env.RPC_URL || 'https://eth.llamarpc.com';
  const WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1';

  console.log('🔍 Approval Guard - Basic Scan Example\n');
  console.log(`Scanning wallet: ${WALLET_ADDRESS}`);
  console.log(`Using RPC: ${RPC_URL}\n`);

  try {
    // Initialize the scanner
    const scanner = new ApprovalScanner({
      rpcUrl: RPC_URL,
      batchSize: 100,
      timeout: 30000
    });

    // Scan the wallet for all approvals
    console.log('Fetching approvals...');
    const approvals = await scanner.scanWallet(WALLET_ADDRESS);
    console.log(`Found ${approvals.length} approvals\n`);

    if (approvals.length === 0) {
      console.log('✅ No token approvals found for this wallet.');
      return;
    }

    // Calculate risk scores for each approval
    console.log('Calculating risk scores...');
    const riskCalculator = new RiskCalculator();
    const scoredApprovals = approvals.map(approval => ({
      ...approval,
      riskScore: riskCalculator.calculateScore(approval)
    }));

    // Generate the report
    console.log('Generating report...\n');
    const reportGenerator = new ReportGenerator();
    const report = reportGenerator.generateReport(scoredApprovals, WALLET_ADDRESS);

    // Display summary
    console.log('='.repeat(50));
    console.log('SCAN SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Approvals: ${report.summary.totalApprovals}`);
    console.log(`Critical Risk:   ${report.summary.criticalRiskCount}`);
    console.log(`High Risk:       ${report.summary.highRiskCount}`);
    console.log(`Medium Risk:     ${report.summary.mediumRiskCount}`);
    console.log(`Low Risk:        ${report.summary.lowRiskCount}`);
    console.log('='.repeat(50));

    // Display high-risk approvals
    const highRiskApprovals = scoredApprovals.filter(
      a => a.riskScore.level === 'high' || a.riskScore.level === 'critical'
    );

    if (highRiskApprovals.length > 0) {
      console.log('\n⚠️  HIGH RISK APPROVALS:\n');
      highRiskApprovals.forEach((approval, index) => {
        console.log(`${index + 1}. ${approval.tokenSymbol}`);
        console.log(`   Spender: ${approval.spenderName || approval.spenderAddress}`);
        console.log(`   Allowance: ${approval.isUnlimited ? 'UNLIMITED' : approval.allowance.toString()}`);
        console.log(`   Risk Score: ${approval.riskScore.score}/100 (${approval.riskScore.level})`);
        console.log(`   Recommendation: ${approval.riskScore.recommendation}`);
        console.log('');
      });
    }

    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:\n');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.action}: ${rec.tokenSymbol} approval for ${rec.spenderName || rec.spenderAddress}`);
        console.log(`   Reason: ${rec.reason}\n`);
      });
    }

    // Output full report as JSON
    console.log('\n📄 Full report saved to: approval-report.json');
    // In a real scenario: fs.writeFileSync('approval-report.json', JSON.stringify(report, null, 2));

  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('❌ Validation Error:', error.message);
      console.error('Please check that the wallet address is valid.');
    } else if (error instanceof NetworkError) {
      console.error('❌ Network Error:', error.message);
      console.error('Please check your RPC endpoint and network connection.');
    } else {
      console.error('❌ Unexpected Error:', error);
    }
    process.exit(1);
  }
}

main();
