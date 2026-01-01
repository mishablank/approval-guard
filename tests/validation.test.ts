import {
  validateAddress,
  validatePositiveNumber,
  validateNonEmptyString,
  validateNonEmptyArray,
  validateRiskScore,
  validateConfig,
  createSafeValidator,
  composeValidators,
} from '../src/utils/validation';
import { ValidationError } from '../src/errors';

describe('Validation Utilities', () => {
  describe('validateAddress', () => {
    it('should accept valid addresses', () => {
      expect(() =>
        validateAddress('0x1234567890123456789012345678901234567890')
      ).not.toThrow();
    });

    it('should reject empty addresses', () => {
      expect(() => validateAddress('')).toThrow(ValidationError);
      expect(() => validateAddress('')).toThrow('address is required');
    });

    it('should reject invalid addresses', () => {
      expect(() => validateAddress('0x123')).toThrow(ValidationError);
      expect(() => validateAddress('0x123')).toThrow('not a valid Ethereum address');
    });

    it('should use custom field name in error message', () => {
      expect(() => validateAddress('', 'walletAddress')).toThrow(
        'walletAddress is required'
      );
    });
  });

  describe('validatePositiveNumber', () => {
    it('should accept zero', () => {
      expect(() => validatePositiveNumber(0)).not.toThrow();
    });

    it('should accept positive numbers', () => {
      expect(() => validatePositiveNumber(42)).not.toThrow();
      expect(() => validatePositiveNumber(0.5)).not.toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => validatePositiveNumber(-1)).toThrow(ValidationError);
      expect(() => validatePositiveNumber(-1)).toThrow('must be non-negative');
    });

    it('should reject NaN', () => {
      expect(() => validatePositiveNumber(NaN)).toThrow('cannot be NaN');
    });
  });

  describe('validateNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(() => validateNonEmptyString('hello')).not.toThrow();
    });

    it('should reject empty strings', () => {
      expect(() => validateNonEmptyString('')).toThrow('cannot be empty');
    });

    it('should reject whitespace-only strings', () => {
      expect(() => validateNonEmptyString('   ')).toThrow('cannot be empty');
    });
  });

  describe('validateNonEmptyArray', () => {
    it('should accept non-empty arrays', () => {
      expect(() => validateNonEmptyArray([1, 2, 3])).not.toThrow();
    });

    it('should reject empty arrays', () => {
      expect(() => validateNonEmptyArray([])).toThrow('cannot be empty');
    });

    it('should reject non-arrays', () => {
      expect(() => validateNonEmptyArray('not an array' as any)).toThrow(
        'must be an array'
      );
    });
  });

  describe('validateRiskScore', () => {
    it('should accept valid risk scores', () => {
      expect(() => validateRiskScore(0)).not.toThrow();
      expect(() => validateRiskScore(50)).not.toThrow();
      expect(() => validateRiskScore(100)).not.toThrow();
    });

    it('should reject scores over 100', () => {
      expect(() => validateRiskScore(101)).toThrow('must be between 0 and 100');
    });

    it('should reject negative scores', () => {
      expect(() => validateRiskScore(-1)).toThrow('must be non-negative');
    });
  });

  describe('validateConfig', () => {
    it('should return valid for correct config', () => {
      const result = validateConfig({
        rpcUrl: 'https://eth.example.com',
        chainId: 1,
        batchSize: 100,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid config', () => {
      const result = validateConfig({
        rpcUrl: 123,
        chainId: -1,
        batchSize: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('rpcUrl must be a string');
      expect(result.errors).toContain('chainId must be a positive number');
      expect(result.errors).toContain('batchSize must be a positive number');
    });
  });

  describe('createSafeValidator', () => {
    it('should return valid result for passing validation', () => {
      const safeValidate = createSafeValidator(validatePositiveNumber);
      const result = safeValidate(42);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result with errors for failing validation', () => {
      const safeValidate = createSafeValidator(validatePositiveNumber);
      const result = safeValidate(-1);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('composeValidators', () => {
    it('should run all validators', () => {
      const validateStringScore = composeValidators(
        (value: { score: number }) => validatePositiveNumber(value.score, 'score'),
        (value: { score: number }) => validateRiskScore(value.score)
      );

      expect(() => validateStringScore({ score: 50 })).not.toThrow();
      expect(() => validateStringScore({ score: -1 })).toThrow('must be non-negative');
      expect(() => validateStringScore({ score: 150 })).toThrow('must be between 0 and 100');
    });
  });
});
