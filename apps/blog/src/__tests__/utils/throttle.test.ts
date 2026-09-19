import { describe, expect, it } from "bun:test";

import { throttle } from "@/utils/throttle";

const WAIT_MS = 30;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("throttle", () => {
  it("invokes on the leading edge", () => {
    const calls: number[] = [];
    const fn = throttle((n: number) => calls.push(n), WAIT_MS);

    fn(1);

    expect(calls).toEqual([1]);
    fn.cancel();
  });

  it("collapses a burst into one leading and one trailing call", async () => {
    const calls: number[] = [];
    const fn = throttle((n: number) => calls.push(n), WAIT_MS);

    fn(1);
    fn(2);
    fn(3);
    expect(calls).toEqual([1]);

    await sleep(WAIT_MS * 2);

    // The trailing call carries the most recent arguments, not the dropped ones.
    expect(calls).toEqual([1, 3]);
    fn.cancel();
  });

  it("invokes again once the window has elapsed", async () => {
    const calls: number[] = [];
    const fn = throttle((n: number) => calls.push(n), WAIT_MS);

    fn(1);
    await sleep(WAIT_MS * 2);
    fn(2);

    expect(calls).toEqual([1, 2]);
    fn.cancel();
  });

  it("cancel drops the pending trailing call", async () => {
    const calls: number[] = [];
    const fn = throttle((n: number) => calls.push(n), WAIT_MS);

    fn(1);
    fn(2);
    fn.cancel();
    await sleep(WAIT_MS * 2);

    expect(calls).toEqual([1]);
  });

  it("cancel is safe with nothing pending", () => {
    const fn = throttle(() => undefined, WAIT_MS);
    expect(() => {
      fn.cancel();
      fn.cancel();
    }).not.toThrow();
  });
});
