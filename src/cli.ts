#!/usr/bin/env node

import { Command } from 'commander';
import { createPublicClient, http, type Address } from 'viem';
import { mainnet, polygon, arbitrum, optimism } from 'viem/chains';
import { ApprovalScanner } from './scanner';
import { ReportGenerator } from './services/report-generator';
import { RiskScorer } from './risk-scorer';
import { config } from './config';
import { handleError, ApprovalGuardError } from './errors';
import { validateAddress, validateOutputPath } from './utils/validation';
import { createSpinner } from './utils/spinner';
import { logger, LogLevel } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const CHAINS = {
  mainnet,
  polygon,
  arbitrum,
  optimism,
} as const;

type ChainName = keyof typeof CHAINS;

interface ScanOptions {
  chain: ChainName;
  output?: string;
  format: 'json' | 'table' | 'minimal';
  verbose?: boolean;
  quiet?: boolean;
  threshold?: string;
}

const program = new Command();

program
  .name('approval-guard')
  .description('Scan Ethereum wallet token approvals and assess risks')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a wallet for token approvals')
  .argument('<address>', 'Wallet address to scan')
  .option('-c, --chain <chain>', 'Chain to scan', 'mainnet')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, table, minimal)', 'table')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('-t, --threshold <score>', 'Minimum risk score to display', '0')
  .action(async (address: string, options: ScanOptions) => {
    // Configure logging
    if (options.quiet) {
      logger.setLevel(LogLevel.ERROR);
    } else if (options.verbose) {
      logger.setLevel(LogLevel.DEBUG);
    }

    const spinner = createSpinner();

    try {
      // Validate inputs
      if (!validateAddress(address)) {
        throw new ApprovalGuardError('Invalid Ethereum address provided');
      }

      if (options.output && !validateOutputPath(options.output)) {
        throw new ApprovalGuardError('Invalid output path provided');
      }

      const chainName = options.chain as ChainName;
      if (!CHAINS[chainName]) {
        throw new ApprovalGuardError(`Unsupported chain: ${options.chain}`);
      }

      logger.header('Approval Guard Scanner');
      logger.info(`Scanning wallet: ${logger.formatAddress(address, false)}`);
      logger.info(`Chain: ${chainName}`);
      logger.divider();

      const chain = CHAINS[chainName];
      const client = createPublicClient({
        chain,
        transport: http(config.rpcUrl),
      });

      const scanner = new ApprovalScanner(client as any);
      const riskScorer = new RiskScorer();
      const reportGenerator = new ReportGenerator();

      spinner.start('Fetching approvals...');
      const approvals = await scanner.scanWallet(address as Address);
      spinner.succeed(`Found ${approvals.length} approvals`);

      if (approvals.length === 0) {
        logger.success('No token approvals found for this wallet!');
        return;
      }

      spinner.start('Analyzing risk...');
      const scoredApprovals = approvals.map(approval => ({
        ...approval,
        riskScore: riskScorer.calculateRiskScore(approval),
        riskFactors: riskScorer.getRiskFactors(approval),
      }));
      spinner.succeed('Risk analysis complete');

      // Filter by threshold
      const threshold = parseInt(options.threshold || '0', 10);
      const filteredApprovals = scoredApprovals.filter(
        a => a.riskScore >= threshold
      );

      // Output results
      logger.header('Scan Results');

      if (options.format === 'table') {
        displayTableOutput(filteredApprovals, logger);
      } else if (options.format === 'minimal') {
        displayMinimalOutput(filteredApprovals, logger);
      }

      // Generate JSON report
      const report = reportGenerator.generate({
        wallet: address as Address,
        chain: chainName,
        approvals: scoredApprovals,
        scanDate: new Date().toISOString(),
      });

      if (options.format === 'json' || options.output) {
        const jsonOutput = JSON.stringify(report, null, 2);
        
        if (options.output) {
          const outputPath = path.resolve(options.output);
          fs.writeFileSync(outputPath, jsonOutput);
          logger.success(`Report saved to: ${outputPath}`);
        } else if (options.format === 'json') {
          console.log(jsonOutput);
        }
      }

      // Summary
      logger.divider();
      const criticalCount = scoredApprovals.filter(a => a.riskScore >= 80).length;
      const highCount = scoredApprovals.filter(a => a.riskScore >= 60 && a.riskScore < 80).length;
      
      logger.info(`Total approvals: ${scoredApprovals.length}`);
      if (criticalCount > 0) {
        logger.warn(`Critical risk approvals: ${criticalCount}`);
      }
      if (highCount > 0) {
        logger.warn(`High risk approvals: ${highCount}`);
      }

    } catch (error) {
      spinner.fail('Scan failed');
      handleError(error);
      process.exit(1);
    }
  });

function displayTableOutput(approvals: any[], log: typeof logger): void {
  for (const approval of approvals) {
    log.divider('─', 60);
    console.log(`  Token:   ${log.formatAddress(approval.tokenAddress)}`);
    console.log(`  Spender: ${log.formatAddress(approval.spender)}`);
    console.log(`  Amount:  ${log.formatAmount(approval.allowance, approval.isUnlimited)}`);
    console.log(`  Risk:    ${log.riskBadge(approval.riskScore)}`);
    
    if (approval.riskFactors && approval.riskFactors.length > 0) {
      console.log(`  Factors: ${approval.riskFactors.join(', ')}`);
    }
  }
  log.divider('─', 60);
}

function displayMinimalOutput(approvals: any[], log: typeof logger): void {
  for (const approval of approvals) {
    const risk = log.riskBadge(approval.riskScore);
    console.log(`${risk} ${log.formatAddress(approval.tokenAddress)} → ${log.formatAddress(approval.spender)}`);
  }
}

program.parse();
