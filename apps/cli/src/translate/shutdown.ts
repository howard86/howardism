import type { EventEmitter } from "node:events";

type ShutdownSignal = "SIGINT" | "SIGTERM";

interface RegisterSignalShutdownArgs {
  exit: (code: 130 | 143) => void;
  flush: () => Promise<void>;
  killEngines: () => Promise<void>;
  signalSource: Pick<EventEmitter, "on" | "off">;
  stopQueue: () => void;
}

/** Install graceful signal shutdown; a repeated signal exits immediately. */
export function registerSignalShutdown(
  args: RegisterSignalShutdownArgs
): () => void {
  let exitCode: 130 | 143 | undefined;
  let exitRequested = false;
  let shutdown: Promise<void> | undefined;

  const exitOnce = (code: 130 | 143): void => {
    if (!exitRequested) {
      exitRequested = true;
      args.exit(code);
    }
  };

  const handleSignal = (signal: ShutdownSignal): void => {
    if (shutdown) {
      exitOnce(exitCode ?? (signal === "SIGINT" ? 130 : 143));
      return;
    }

    exitCode = signal === "SIGINT" ? 130 : 143;
    args.stopQueue();
    shutdown = (async () => {
      try {
        await args.killEngines();
      } catch (error) {
        console.error(
          `[translate] engine shutdown failed: ${(error as Error).message}`
        );
      }
      try {
        await args.flush();
      } catch (error) {
        console.error(
          `[translate] interrupt flush failed: ${(error as Error).message}`
        );
      }
      exitOnce(exitCode as 130 | 143);
    })();
  };

  const onInterrupt = () => handleSignal("SIGINT");
  const onTerminate = () => handleSignal("SIGTERM");
  args.signalSource.on("SIGINT", onInterrupt);
  args.signalSource.on("SIGTERM", onTerminate);

  return () => {
    args.signalSource.off("SIGINT", onInterrupt);
    args.signalSource.off("SIGTERM", onTerminate);
  };
}
