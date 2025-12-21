#!/usr/bin/env node
import { Command } from 'commander';
import { scanApprovals } from './scanner';
import { generateReport } from './reporter';
import { RiskReport } from './types';

const program = new Command();

program
	.name('approval-guard')
	.description('Scan Ethereum wallet token approvals and generate risk assessment')
	.version('1.0.0');

program
	.command('scan')
	.description('Scan a wallet address for ERC-20 token approvals')
	.requiredOption('-a, --address <address>', 'Wallet address to scan')
	.option('-r, --rpc <url>', 'RPC endpoint URL', 'https://eth.llamarpc.com')
	.option('-o, --output <file>', 'Output file path for JSON report')
	.action(async (options) => {
		try {
			console.log(`\n🔍 Scanning approvals for ${options.address}...\n`);
			
			const approvals = await scanApprovals(options.address, options.rpc);
			const report: RiskReport = generateReport(options.address, approvals);
			
			if (options.output) {
				const fs = await import('fs');
				fs.writeFileSync(options.output, JSON.stringify(report, null, 2));
				console.log(`📄 Report saved to ${options.output}`);
			} else {
				console.log(JSON.stringify(report, null, 2));
			}
			
			console.log(`\n⚠️  Overall Risk Score: ${report.overallRiskScore}/100`);
			console.log(`📊 Total Approvals Found: ${report.totalApprovals}`);
			console.log(`🚨 High Risk Approvals: ${report.highRiskCount}\n`);
		} catch (error) {
			console.error('Error scanning approvals:', error);
			process.exit(1);
		}
	});

program.parse();
