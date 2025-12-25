/**
 * Batch processor for handling large sets of approvals efficiently
 */

export interface BatchOptions {
  batchSize: number;
  delayMs?: number;
  onProgress?: (processed: number, total: number) => void;
  onBatchComplete?: (batchIndex: number, results: unknown[]) => void;
}

export interface BatchResult<T> {
  results: T[];
  errors: BatchError[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface BatchError {
  index: number;
  item: unknown;
  error: Error;
}

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_DELAY_MS = 100;

/**
 * Process items in batches with optional delay between batches
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: Partial<BatchOptions> = {}
): Promise<BatchResult<R>> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    delayMs = DEFAULT_DELAY_MS,
    onProgress,
    onBatchComplete,
  } = options;

  const results: R[] = [];
  const errors: BatchError[] = [];
  let totalProcessed = 0;

  const batches = createBatches(items, batchSize);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const batchResults: R[] = [];

    for (let i = 0; i < batch.length; i++) {
      const globalIndex = batchIndex * batchSize + i;
      const item = batch[i];

      try {
        const result = await processor(item, globalIndex);
        results.push(result);
        batchResults.push(result);
      } catch (error) {
        errors.push({
          index: globalIndex,
          item,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }

      totalProcessed++;

      if (onProgress) {
        onProgress(totalProcessed, items.length);
      }
    }

    if (onBatchComplete) {
      onBatchComplete(batchIndex, batchResults);
    }

    // Add delay between batches (except after the last batch)
    if (batchIndex < batches.length - 1 && delayMs > 0) {
      await delay(delayMs);
    }
  }

  return {
    results,
    errors,
    totalProcessed,
    successCount: results.length,
    failureCount: errors.length,
  };
}

/**
 * Process items in parallel batches
 */
export async function processParallelBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: Partial<BatchOptions> = {}
): Promise<BatchResult<R>> {
  const {
    batchSize = DEFAULT_BATCH_SIZE,
    delayMs = DEFAULT_DELAY_MS,
    onProgress,
    onBatchComplete,
  } = options;

  const results: R[] = [];
  const errors: BatchError[] = [];
  let totalProcessed = 0;

  const batches = createBatches(items, batchSize);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    const startIndex = batchIndex * batchSize;

    const batchPromises = batch.map(async (item, i) => {
      const globalIndex = startIndex + i;
      try {
        const result = await processor(item, globalIndex);
        return { success: true as const, result, index: globalIndex };
      } catch (error) {
        return {
          success: false as const,
          error: error instanceof Error ? error : new Error(String(error)),
          item,
          index: globalIndex,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    const successResults: R[] = [];

    for (const result of batchResults) {
      totalProcessed++;
      if (result.success) {
        results.push(result.result);
        successResults.push(result.result);
      } else {
        errors.push({
          index: result.index,
          item: result.item,
          error: result.error,
        });
      }
    }

    if (onProgress) {
      onProgress(totalProcessed, items.length);
    }

    if (onBatchComplete) {
      onBatchComplete(batchIndex, successResults);
    }

    // Add delay between batches (except after the last batch)
    if (batchIndex < batches.length - 1 && delayMs > 0) {
      await delay(delayMs);
    }
  }

  return {
    results,
    errors,
    totalProcessed,
    successCount: results.length,
    failureCount: errors.length,
  };
}

/**
 * Split an array into batches of specified size
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  if (batchSize <= 0) {
    throw new Error('Batch size must be greater than 0');
  }

  const batches: T[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delayTime = baseDelayMs * Math.pow(2, attempt);
        await delay(delayTime);
      }
    }
  }

  throw lastError;
}
