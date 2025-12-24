import { Command } from 'commander';
import { version } from '../package.json';

export interface CliOptions {
  wallet: string;
  output?: string;
  format: 'json' | 'table';
  rpcUrl?: string;
  verbose: boolean;
  threshold?: number;
}

export function parseArgs(args: string[]): CliOptions {
  const program = new Command();

  program
    .name('approval-guard')
    .description('Scan Ethereum wallet token approvals and generate risk assessment reports')
    .version(version)
    .requiredOption(
      '-w, --wallet <address>',
      'Ethereum wallet address to scan'
    )
    .option(
      '-o, --output <file>',
      'Output file path for the report'
    )
    .option(
      '-f, --format <format>',
      'Output format (json or table)',
      'json'
    )
    .option(
      '-r, --rpc-url <url>',
      'Custom RPC URL (overrides .env)'
    )
    .option(
      '-v, --verbose',
      'Enable verbose output',
      false
    )
    .option(
      '-t, --threshold <score>',
      'Minimum risk score to include in report',
      parseFloat
    );

  program.parse(args);

  const options = program.opts();

  return {
    wallet: options.wallet,
    output: options.output,
    format: options.format as 'json' | 'table',
    rpcUrl: options.rpcUrl,
    verbose: options.verbose,
    threshold: options.threshold,
  };
}

export function validateOptions(options: CliOptions): void {
  // Validate wallet address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(options.wallet)) {
    throw new Error(`Invalid wallet address: ${options.wallet}`);
  }

  // Validate format
  if (!['json', 'table'].includes(options.format)) {
    throw new Error(`Invalid format: ${options.format}. Must be 'json' or 'table'`);
  }

  // Validate threshold if provided
  if (options.threshold !== undefined) {
    if (isNaN(options.threshold) || options.threshold < 0 || options.threshold > 100) {
      throw new Error(`Invalid threshold: ${options.threshold}. Must be between 0 and 100`);
    }
  }

  // Validate RPC URL if provided
  if (options.rpcUrl) {
    try {
      new URL(options.rpcUrl);
    } catch {
      throw new Error(`Invalid RPC URL: ${options.rpcUrl}`);
    }
  }
}

export function printHelp(): void {
  console.log(`
Examples:
  $ approval-guard -w 0x742d35Cc6634C0532925a3b844Bc9e7595f5b0e1
  $ approval-guard -w 0x742d35Cc6634C0532925a3b844Bc9e7595f5b0e1 -o report.json
  $ approval-guard -w 0x742d35Cc6634C0532925a3b844Bc9e7595f5b0e1 -f table -v
  $ approval-guard -w 0x742d35Cc6634C0532925a3b844Bc9e7595f5b0e1 -t 50
`);
}
