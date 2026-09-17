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
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const i = nextIndex;
        nextIndex += 1;
        // biome-ignore lint/performance/noAwaitInLoops: this *is* the concurrency limiter — each worker awaits one item at a time so at most `concurrency` run at once; Promise.all here would unbound it
        results[i] = await worker(items[i]);
      }
    }
  );
  await Promise.all(workers);
  return results;
}
