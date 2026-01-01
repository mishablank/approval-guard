import { isAddress } from 'viem';
import { ValidationError } from '../errors';

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate an Ethereum address
 */
export function validateAddress(address: string, fieldName = 'address'): void {
  if (!address) {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }

  if (typeof address !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  if (!isAddress(address)) {
    throw new ValidationError(
      `${fieldName} "${address}" is not a valid Ethereum address`,
      fieldName
    );
  }
}

/**
 * Validate a positive number
 */
export function validatePositiveNumber(
  value: number,
  fieldName = 'value'
): void {
  if (typeof value !== 'number') {
    throw new ValidationError(`${fieldName} must be a number`, fieldName);
  }

  if (isNaN(value)) {
    throw new ValidationError(`${fieldName} cannot be NaN`, fieldName);
  }

  if (value < 0) {
    throw new ValidationError(`${fieldName} must be non-negative`, fieldName);
  }
}

/**
 * Validate a non-empty string
 */
export function validateNonEmptyString(
  value: string,
  fieldName = 'value'
): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName);
  }

  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }
}

/**
 * Validate an array is not empty
 */
export function validateNonEmptyArray<T>(
  value: T[],
  fieldName = 'array'
): void {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName);
  }

  if (value.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, fieldName);
  }
}

/**
 * Validate risk score is within valid range
 */
export function validateRiskScore(score: number): void {
  validatePositiveNumber(score, 'riskScore');

  if (score > 100) {
    throw new ValidationError(
      'riskScore must be between 0 and 100',
      'riskScore'
    );
  }
}

/**
 * Validate configuration object
 */
export function validateConfig(config: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (config.rpcUrl !== undefined && typeof config.rpcUrl !== 'string') {
    errors.push('rpcUrl must be a string');
  }

  if (config.chainId !== undefined) {
    if (typeof config.chainId !== 'number' || config.chainId <= 0) {
      errors.push('chainId must be a positive number');
    }
  }

  if (config.batchSize !== undefined) {
    if (typeof config.batchSize !== 'number' || config.batchSize <= 0) {
      errors.push('batchSize must be a positive number');
    }
  }

  if (config.timeout !== undefined) {
    if (typeof config.timeout !== 'number' || config.timeout <= 0) {
      errors.push('timeout must be a positive number');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a safe validator that returns a result instead of throwing
 */
export function createSafeValidator<T>(
  validator: (value: T) => void
): (value: T) => ValidationResult {
  return (value: T): ValidationResult => {
    try {
      validator(value);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { valid: false, errors: [error.message] };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  };
}

/**
 * Compose multiple validators
 */
export function composeValidators<T>(
  ...validators: Array<(value: T) => void>
): (value: T) => void {
  return (value: T): void => {
    for (const validator of validators) {
      validator(value);
    }
  };
}
