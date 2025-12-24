import { ApprovalGuardError, ErrorCode } from './approval-guard-error';
import { NetworkError } from './network-error';
import { ValidationError } from './validation-error';

export interface ErrorHandlerOptions {
  verbose?: boolean;
  exitOnError?: boolean;
}

export class ErrorHandler {
  private readonly options: ErrorHandlerOptions;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      verbose: false,
      exitOnError: true,
      ...options,
    };
  }

  public handle(error: unknown): never | void {
    const wrappedError = this.normalize(error);
    this.log(wrappedError);

    if (this.options.exitOnError) {
      process.exit(this.getExitCode(wrappedError));
    }
  }

  public normalize(error: unknown): ApprovalGuardError {
    if (ApprovalGuardError.isApprovalGuardError(error)) {
      return error;
    }

    if (error instanceof Error) {
      // Try to categorize common error types
      if (this.isNetworkError(error)) {
        return new NetworkError(error.message, { cause: error });
      }
    }

    return ApprovalGuardError.wrap(error);
  }

  private isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      /ECONNREFUSED/i,
      /ENOTFOUND/i,
      /ETIMEDOUT/i,
      /network/i,
      /fetch failed/i,
      /connection/i,
    ];
    return networkErrorPatterns.some((pattern) => pattern.test(error.message));
  }

  private log(error: ApprovalGuardError): void {
    const prefix = this.getErrorPrefix(error);
    console.error(`\n${prefix} ${error.message}`);

    if (error instanceof ValidationError && error.issues.length > 0) {
      console.error('\nValidation issues:');
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.field}: ${issue.message}`);
      });
    }

    if (error instanceof NetworkError && error.retryable) {
      console.error('\nThis error may be temporary. Please try again.');
    }

    if (this.options.verbose) {
      console.error('\nError details:', JSON.stringify(error.toJSON(), null, 2));
      if (error.stack) {
        console.error('\nStack trace:', error.stack);
      }
    }
  }

  private getErrorPrefix(error: ApprovalGuardError): string {
    if (error instanceof ValidationError) {
      return '❌ Validation Error:';
    }
    if (error instanceof NetworkError) {
      return '🌐 Network Error:';
    }
    return '⚠️ Error:';
  }

  private getExitCode(error: ApprovalGuardError): number {
    switch (error.code) {
      case ErrorCode.INVALID_ADDRESS:
      case ErrorCode.INVALID_CHAIN_ID:
      case ErrorCode.INVALID_CONFIG:
        return 1; // User input error
      case ErrorCode.NETWORK_ERROR:
      case ErrorCode.RPC_ERROR:
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return 2; // Network/external error
      case ErrorCode.SCAN_FAILED:
      case ErrorCode.REPORT_GENERATION_FAILED:
        return 3; // Operation error
      default:
        return 1;
    }
  }
}

export const defaultErrorHandler = new ErrorHandler();
