export enum ErrorCode {
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_CHAIN_ID = 'INVALID_CHAIN_ID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RPC_ERROR = 'RPC_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  SCAN_FAILED = 'SCAN_FAILED',
  REPORT_GENERATION_FAILED = 'REPORT_GENERATION_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorContext {
  code: ErrorCode;
  details?: Record<string, unknown>;
  cause?: Error;
}

export class ApprovalGuardError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;
  public readonly timestamp: Date;

  constructor(message: string, context: ErrorContext) {
    super(message);
    this.name = 'ApprovalGuardError';
    this.code = context.code;
    this.details = context.details;
    this.cause = context.cause;
    this.timestamp = new Date();

    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApprovalGuardError);
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  public static isApprovalGuardError(error: unknown): error is ApprovalGuardError {
    return error instanceof ApprovalGuardError;
  }

  public static wrap(error: unknown, code: ErrorCode = ErrorCode.UNKNOWN_ERROR): ApprovalGuardError {
    if (ApprovalGuardError.isApprovalGuardError(error)) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error ? error : undefined;

    return new ApprovalGuardError(message, { code, cause });
  }
}
