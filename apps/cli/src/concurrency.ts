/**
 * Run `worker` over `items` with at most `concurrency` workers in flight.
 * Preserves input ordering in the returned results array.
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let failed = false;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (nextIndex < items.length && !failed) {
        const i = nextIndex;
        nextIndex += 1;
        try {
          // biome-ignore lint/performance/noAwaitInLoops: Each worker processes one item at a time.
          results[i] = await worker(items[i]);
        } catch (error) {
          failed = true;
          throw error;
        }
      }
    }
  );
  // Settle in-flight writes before the caller releases a workspace lock or removes staging.
  const settled = await Promise.allSettled(workers);
  const failure = settled.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") {
    throw failure.reason;
  }
  return results;
}
