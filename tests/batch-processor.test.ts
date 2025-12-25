import {
  processBatch,
  processParallelBatch,
  createBatches,
  retryWithBackoff,
} from '../src/utils/batch-processor';

describe('batch-processor', () => {
  describe('createBatches', () => {
    it('should split array into batches', () => {
      const items = [1, 2, 3, 4, 5, 6, 7];
      const batches = createBatches(items, 3);

      expect(batches).toHaveLength(3);
      expect(batches[0]).toEqual([1, 2, 3]);
      expect(batches[1]).toEqual([4, 5, 6]);
      expect(batches[2]).toEqual([7]);
    });

    it('should handle empty array', () => {
      const batches = createBatches([], 3);
      expect(batches).toHaveLength(0);
    });

    it('should throw for invalid batch size', () => {
      expect(() => createBatches([1, 2, 3], 0)).toThrow();
      expect(() => createBatches([1, 2, 3], -1)).toThrow();
    });
  });

  describe('processBatch', () => {
    it('should process items sequentially', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn().mockImplementation(async (n: number) => n * 2);

      const result = await processBatch(items, processor, {
        batchSize: 2,
        delayMs: 0,
      });

      expect(result.results).toEqual([2, 4, 6, 8, 10]);
      expect(result.successCount).toBe(5);
      expect(result.failureCount).toBe(0);
      expect(processor).toHaveBeenCalledTimes(5);
    });

    it('should handle errors gracefully', async () => {
      const items = [1, 2, 3];
      const processor = jest.fn().mockImplementation(async (n: number) => {
        if (n === 2) throw new Error('Test error');
        return n * 2;
      });

      const result = await processBatch(items, processor, {
        batchSize: 2,
        delayMs: 0,
      });

      expect(result.results).toEqual([2, 6]);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.errors[0].index).toBe(1);
    });

    it('should call progress callback', async () => {
      const items = [1, 2, 3];
      const onProgress = jest.fn();

      await processBatch(items, async (n) => n, {
        batchSize: 2,
        delayMs: 0,
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenLastCalledWith(3, 3);
    });
  });

  describe('processParallelBatch', () => {
    it('should process items in parallel within batches', async () => {
      const items = [1, 2, 3, 4];
      const processor = jest.fn().mockImplementation(async (n: number) => n * 2);

      const result = await processParallelBatch(items, processor, {
        batchSize: 2,
        delayMs: 0,
      });

      expect(result.results).toHaveLength(4);
      expect(result.successCount).toBe(4);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first try', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(fn, 3, 10);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('persistent error'));

      await expect(retryWithBackoff(fn, 2, 10)).rejects.toThrow('persistent error');
      expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });
});
