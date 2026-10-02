/** biome-ignore-all lint/performance/noAwaitInLoops: Streaming reads must remain sequential to enforce byte limits. */
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { digestSchema } from "@howardism/article-contract/manifests/content-release";
import { samplePublicBaseUrlSchema } from "@howardism/article-contract/manifests/sample-release";
import type { ReadObjectStore } from "./store";

const SAMPLE_KEY =
  /^fixtures\/v1\/(?:objects\/sha256\/([a-f0-9]{2})\/([a-f0-9]{64})|releases\/([a-f0-9]{64})\.json)$/;
const DEFAULT_TIMEOUT_MS = 30_000;
const blockedV4 = new BlockList();
const blockedV6 = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
] as const) {
  blockedV4.addSubnet(address, prefix, "ipv4");
}
for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["::ffff:0:0", 96],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blockedV6.addSubnet(address, prefix, "ipv6");
}

export type PublicFetcher = (url: URL, init: RequestInit) => Promise<Response>;
export type PublicHostResolver = (host: string) => Promise<string[]>;
const resolvePublicHost: PublicHostResolver = async (host) =>
  (await lookup(host, { all: true })).map((record) => record.address);

async function assertPublicHost(
  host: string,
  resolver: PublicHostResolver
): Promise<void> {
  const addresses = await resolver(host);
  if (
    !addresses.length ||
    addresses.some((address) => {
      const family = isIP(address);
      return (
        !family ||
        (family === 4
          ? blockedV4.check(address, "ipv4")
          : blockedV6.check(address, "ipv6"))
      );
    })
  ) {
    throw new Error(
      "Public fixture host resolves to a private or invalid address"
    );
  }
}

async function readBoundedResponse(
  response: Response,
  key: string,
  maxBytes: number,
  origin: string
): Promise<Uint8Array> {
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`Public fixture redirect rejected: ${key}`);
  }
  if (!(response.ok && response.body)) {
    throw new Error(`Public fixture HTTP ${response.status}: ${key}`);
  }
  if (response.url && new URL(response.url).origin !== origin) {
    throw new Error("Public fixture response changed origin");
  }
  const declared = response.headers.get("content-length");
  if (declared && Number(declared) > maxBytes) {
    throw new Error(`Public fixture response exceeds limit: ${key}`);
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      size += chunk.value.byteLength;
      if (size > maxBytes) {
        throw new Error(`Public fixture response exceeds limit: ${key}`);
      }
      chunks.push(chunk.value);
      chunk = await reader.read();
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks);
}

/** Public reader accepts only hash-derived fixture keys from one pinned HTTPS origin. */
export function publicFixtureStore(
  baseUrl: string,
  fetcher: PublicFetcher = (url, init) => fetch(url, init),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  resolver: PublicHostResolver = resolvePublicHost
): ReadObjectStore {
  const parsed = samplePublicBaseUrlSchema.parse(baseUrl);
  const base = new URL(parsed);
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 120_000
  ) {
    throw new Error("Invalid public fixture timeout");
  }
  if (!base.pathname.endsWith("/")) {
    base.pathname = `${base.pathname}/`;
  }
  let safeHost: Promise<void> | undefined;
  return {
    async get(key, maxBytes) {
      const match = SAMPLE_KEY.exec(key);
      if (!match || (match[2] && match[1] !== match[2].slice(0, 2))) {
        throw new Error("Unsafe public fixture key");
      }
      digestSchema.parse(match[2] ?? match[3]);
      if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
        throw new Error("Invalid public fixture size limit");
      }
      const url = new URL(key, base);
      if (
        url.origin !== base.origin ||
        !url.pathname.startsWith(base.pathname)
      ) {
        throw new Error("Fixture object escaped the pinned origin");
      }
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error(`Public fixture request timed out: ${key}`));
        }, timeoutMs);
      });
      const request = async (): Promise<Uint8Array> => {
        safeHost ??= assertPublicHost(base.hostname, resolver);
        await safeHost;
        const response = await fetcher(url, {
          method: "GET",
          redirect: "manual",
          credentials: "omit",
          cache: "no-store",
          headers: { "Accept-Encoding": "identity" },
          signal: controller.signal,
        });
        return await readBoundedResponse(response, key, maxBytes, base.origin);
      };
      try {
        return await Promise.race([request(), timeout]);
      } finally {
        if (timer) {
          clearTimeout(timer);
        }
        controller.abort();
      }
    },
  };
}
