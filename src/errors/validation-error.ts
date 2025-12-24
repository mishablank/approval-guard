import { ApprovalGuardError, ErrorCode } from './approval-guard-error';

export interface ValidationIssue {
  field: string;
  message: string;
  value?: unknown;
}

export class ValidationError extends ApprovalGuardError {
  public readonly issues: ValidationIssue[];

  constructor(message: string, issues: ValidationIssue[]) {
    super(message, {
      code: ErrorCode.INVALID_CONFIG,
      details: { issues },
    });
    this.name = 'ValidationError';
    this.issues = issues;
  }

  public static invalidAddress(address: string, field: string = 'address'): ValidationError {
    return new ValidationError(`Invalid Ethereum address: ${address}`, [
      {
        field,
        message: 'Must be a valid Ethereum address (0x followed by 40 hex characters)',
        value: address,
      },
    ]);
  }

  public static invalidChainId(chainId: unknown): ValidationError {
    return new ValidationError(`Invalid chain ID: ${chainId}`, [
      {
        field: 'chainId',
        message: 'Must be a positive integer representing a valid EVM chain',
        value: chainId,
      },
    ]);
  }

  public static missingRequired(fields: string[]): ValidationError {
    const issues = fields.map((field) => ({
      field,
      message: `${field} is required`,
    }));
    return new ValidationError(`Missing required fields: ${fields.join(', ')}`, issues);
  }

  public static combine(errors: ValidationError[]): ValidationError {
    const allIssues = errors.flatMap((e) => e.issues);
    return new ValidationError(
      `Multiple validation errors: ${allIssues.map((i) => i.message).join('; ')}`,
      allIssues
    );
  }
}
