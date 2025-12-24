#!/usr/bin/env node

import { config } from 'dotenv';
import { parseArgs, validateOptions, CliOptions } from './cli';

// Load environment variables
config();

async function main(): Promise<void> {
  try {
    const options: CliOptions = parseArgs(process.argv);
    validateOptions(options);

    if (options.verbose) {
      console.log('Approval Guard - Token Approval Scanner');
      console.log('========================================');
      console.log(`Scanning wallet: ${options.wallet}`);
      console.log(`Output format: ${options.format}`);
      if (options.output) {
        console.log(`Output file: ${options.output}`);
      }
      if (options.threshold !== undefined) {
        console.log(`Risk threshold: ${options.threshold}`);
      }
      console.log('');
    }

    // TODO: Implement main scanning logic
    console.log('Scanning for token approvals...');
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unexpected error occurred');
    }
    process.exit(1);
  }
}

main();
