import { ApprovalGuardError, ErrorCode } from './approval-guard-error';

export class NetworkError extends ApprovalGuardError {
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      retryable?: boolean;
      cause?: Error;
      details?: Record<string, unknown>;
    } = {}
  ) {
    super(message, {
      code: ErrorCode.NETWORK_ERROR,
      cause: options.cause,
      details: {
        ...options.details,
        statusCode: options.statusCode,
      },
    });
    this.name = 'NetworkError';
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? this.isRetryableStatus(options.statusCode);
  }

  private isRetryableStatus(status?: number): boolean {
    if (!status) return true;
    // 429 = Rate limited, 5xx = Server errors
    return status === 429 || (status >= 500 && status < 600);
  }

  public static rpcError(message: string, cause?: Error): NetworkError {
    return new NetworkError(`RPC Error: ${message}`, {
      retryable: true,
      cause,
    });
  }

  public static rateLimited(retryAfterMs?: number): NetworkError {
    return new NetworkError('Rate limit exceeded', {
      statusCode: 429,
      retryable: true,
      details: { retryAfterMs },
    });
  }

  public static timeout(operation: string): NetworkError {
    return new NetworkError(`Operation timed out: ${operation}`, {
      retryable: true,
    });
  }

  public static connectionFailed(url: string, cause?: Error): NetworkError {
    return new NetworkError(`Failed to connect to ${url}`, {
      retryable: true,
      cause,
    });
  }
}
