import { describe, expect, it } from "bun:test";
import { EventEmitter } from "node:events";
import { registerSignalShutdown } from "../translate/shutdown.ts";

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: () => void = () => {
    throw new Error("deferred resolver was not initialized");
  };
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("registerSignalShutdown", () => {
  it("flushes before exiting with the signal-specific code", async () => {
    for (const [signal, code] of [
      ["SIGINT", 130],
      ["SIGTERM", 143],
    ] as const) {
      const signalSource = new EventEmitter();
      const flushGate = deferred();
      const flushStarted = deferred();
      const exited = deferred();
      const calls: string[] = [];
      const removeHandlers = registerSignalShutdown({
        exit: (exitCode) => {
          calls.push(`exit:${exitCode}`);
          exited.resolve();
        },
        flush: async () => {
          calls.push("flush");
          flushStarted.resolve();
          await flushGate.promise;
        },
        killEngines: () => {
          calls.push("kill");
          return Promise.resolve();
        },
        signalSource,
        stopQueue: () => calls.push("stop"),
      });

      signalSource.emit(signal);
      await flushStarted.promise;
      expect(calls).toEqual(["stop", "kill", "flush"]);
      flushGate.resolve();
      await exited.promise;
      expect(calls.at(-1)).toBe(`exit:${code}`);
      removeHandlers();
    }
  });

  it("exits immediately with the first code on a second signal during flush", async () => {
    const signalSource = new EventEmitter();
    const flushGate = deferred();
    const flushStarted = deferred();
    const calls: number[] = [];
    const removeHandlers = registerSignalShutdown({
      exit: (code) => calls.push(code),
      flush: async () => {
        flushStarted.resolve();
        await flushGate.promise;
      },
      killEngines: () => Promise.resolve(),
      signalSource,
      stopQueue: () => undefined,
    });

    signalSource.emit("SIGTERM");
    await flushStarted.promise;
    signalSource.emit("SIGINT");
    expect(calls).toEqual([143]);
    flushGate.resolve();
    removeHandlers();
  });
});
