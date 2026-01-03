#!/usr/bin/env node

import { Command } from 'commander';
import { isAddress } from 'viem';
import { scanWalletApprovals } from './scanner.js';
import { generateReport, ReportFormat } from './reporter.js';
import { getConfig } from './config.js';
import { handleError } from './errors/error-handler.js';
import { ValidationError } from './errors/validation-error.js';
import { createSpinner, logSuccess, logError, logInfo, logWarning, symbols } from './utils/spinner.js';

const program = new Command();

program
  .name('approval-guard')
  .description('Scan Ethereum wallet token approvals and assess risks')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a wallet for token approvals')
  .argument('<address>', 'Ethereum wallet address to scan')
  .option('-f, --format <format>', 'Output format (json, text, csv)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .option('-c, --chain <chain>', 'Chain to scan (mainnet, goerli, sepolia)', 'mainnet')
  .option('--min-risk <score>', 'Minimum risk score to include', '0')
  .option('--include-zero', 'Include zero allowance approvals', false)
  .option('-q, --quiet', 'Suppress progress output', false)
  .action(async (address: string, options) => {
    const quiet = options.quiet;
    
    try {
      // Validate address
      if (!isAddress(address)) {
        throw new ValidationError(`Invalid Ethereum address: ${address}`);
      }

      const config = getConfig();
      
      if (!quiet) {
        console.log();
        logInfo(`Approval Guard - Token Approval Scanner`);
        console.log(`${symbols.arrow} Scanning wallet: ${address}`);
        console.log(`${symbols.arrow} Chain: ${options.chain}`);
        console.log();
      }

      // Scan approvals with spinner
      const scanSpinner = !quiet ? createSpinner('Fetching token approvals...', 'cyan') : null;
      scanSpinner?.start();

      const approvals = await scanWalletApprovals(address, {
        chain: options.chain,
        rpcUrl: config.rpcUrl,
      });

      scanSpinner?.succeed(`Found ${approvals.length} token approvals`);

      if (approvals.length === 0) {
        if (!quiet) {
          logInfo('No token approvals found for this wallet');
        }
        return;
      }

      // Analyze risks with spinner
      const analyzeSpinner = !quiet ? createSpinner('Analyzing risk scores...', 'yellow') : null;
      analyzeSpinner?.start();

      // Filter by minimum risk score
      const minRisk = parseInt(options.minRisk, 10);
      const filteredApprovals = approvals.filter(a => a.riskScore >= minRisk);

      // Filter zero allowances if not included
      const finalApprovals = options.includeZero
        ? filteredApprovals
        : filteredApprovals.filter(a => a.allowance !== '0');

      analyzeSpinner?.succeed(`Analyzed ${finalApprovals.length} approvals with risk scores`);

      // Generate report
      const reportSpinner = !quiet ? createSpinner('Generating report...', 'green') : null;
      reportSpinner?.start();

      const format = options.format.toLowerCase() as ReportFormat;
      const report = await generateReport(finalApprovals, {
        format,
        outputPath: options.output,
        walletAddress: address,
        chain: options.chain,
      });

      if (options.output) {
        reportSpinner?.succeed(`Report saved to ${options.output}`);
      } else {
        reportSpinner?.stop();
        console.log();
        console.log(report);
      }

      // Summary
      if (!quiet) {
        console.log();
        const highRisk = finalApprovals.filter(a => a.riskScore >= 80).length;
        const mediumRisk = finalApprovals.filter(a => a.riskScore >= 50 && a.riskScore < 80).length;
        const lowRisk = finalApprovals.filter(a => a.riskScore < 50).length;

        if (highRisk > 0) {
          logWarning(`${highRisk} high-risk approval(s) detected - consider revoking`);
        }
        if (mediumRisk > 0) {
          logInfo(`${mediumRisk} medium-risk approval(s) found`);
        }
        if (lowRisk > 0) {
          logSuccess(`${lowRisk} low-risk approval(s)`);
        }
        console.log();
      }
    } catch (error) {
      if (!quiet) {
        logError('Scan failed');
      }
      handleError(error);
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Quick check for high-risk approvals')
  .argument('<address>', 'Ethereum wallet address to check')
  .option('-c, --chain <chain>', 'Chain to scan', 'mainnet')
  .action(async (address: string, options) => {
    try {
      if (!isAddress(address)) {
        throw new ValidationError(`Invalid Ethereum address: ${address}`);
      }

      const config = getConfig();
      
      const spinner = createSpinner('Checking for high-risk approvals...', 'cyan');
      spinner.start();

      const approvals = await scanWalletApprovals(address, {
        chain: options.chain,
        rpcUrl: config.rpcUrl,
      });

      const highRisk = approvals.filter(a => a.riskScore >= 80 && a.allowance !== '0');

      if (highRisk.length === 0) {
        spinner.succeed('No high-risk approvals found!');
      } else {
        spinner.warn(`Found ${highRisk.length} high-risk approval(s)`);
        console.log();
        
        for (const approval of highRisk) {
          console.log(`  ${symbols.warning} ${approval.tokenSymbol || approval.tokenAddress}`);
          console.log(`    ${symbols.arrow} Spender: ${approval.spenderAddress}`);
          console.log(`    ${symbols.arrow} Risk Score: ${approval.riskScore}/100`);
          console.log();
        }

        logInfo('Run "approval-guard scan" for a detailed report');
      }
    } catch (error) {
      logError('Check failed');
      handleError(error);
      process.exit(1);
    }
  });

program.parse();
