export interface Throttled<Args extends unknown[]> {
  /** Drops a pending trailing call and its timer. */
  cancel: () => void;
  (...args: Args): void;
}

/**
 * Leading + trailing throttle. Invokes immediately, then at most once per
 * `waitMs`, with a trailing call carrying the most recent arguments so the
 * final scroll position is never dropped.
 *
 * Stands in for `lodash.throttle` at the three scroll handlers that use only
 * `fn(...)` and `.cancel()`.
 */
export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number
): Throttled<Args> {
  let lastInvokedAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args | null = null;

  const invoke = (args: Args) => {
    lastInvokedAt = Date.now();
    pendingArgs = null;
    fn(...args);
  };

  const throttled = (...args: Args) => {
    const remaining = waitMs - (Date.now() - lastInvokedAt);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      invoke(args);
      return;
    }
    pendingArgs = args;
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        if (pendingArgs) {
          invoke(pendingArgs);
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pendingArgs = null;
  };

  return throttled;
}
