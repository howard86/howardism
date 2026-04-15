import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionForRoute } from "@/lib/auth";
import { isPrivateHost, resolveAndCheckPrivateIP } from "./isPrivateHost";
import { createPinnedAgent } from "./pinnedAgent";

export const runtime = "nodejs";

const urlSchema = z.string().url();

/** Abort each upstream fetch hop after this many milliseconds. */
const FETCH_TIMEOUT_MS = 5000;

/** Maximum allowed response body size in bytes (1 MB). */
const MAX_BODY_BYTES = 1_000_000;

/**
 * Maximum number of HTTP redirects to follow before giving up.
 * Each hop is individually validated for private-IP and re-validated via DNS.
 * Each hop also gets its own independent FETCH_TIMEOUT_MS budget.
 */
const MAX_REDIRECTS = 3;

// Undici extends the Fetch API with a `dispatcher` option for connection
// pinning. The standard RequestInit type doesn't include it, so we widen the
// type locally to avoid suppressing the whole RequestInit signature.
type PinnedRequestInit = RequestInit & { dispatcher?: unknown };

/**
 * Validates `rawUrl`, checks it is HTTPS and not a private host, then resolves
 * its hostname via DNS and checks none of the returned addresses are private.
 * Returns an error Response on any failure, or `{ url, ip }` on success.
 */
async function validateAndResolveUrl(
  rawUrl: string
): Promise<{ url: URL; ip: string } | Response> {
  const result = urlSchema.safeParse(rawUrl);
  if (!result.success) {
    return NextResponse.json(
      { message: "Invalid url parameter" },
      { status: 400 }
    );
  }

  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "https:" || isPrivateHost(parsed.hostname)) {
    return NextResponse.json(
      { message: "Invalid url parameter" },
      { status: 400 }
    );
  }

  try {
    const resolved = await resolveAndCheckPrivateIP(parsed.hostname);
    return { url: parsed, ip: resolved.ip };
  } catch {
    return NextResponse.json(
      { message: "Invalid url parameter" },
      { status: 400 }
    );
  }
}

/**
 * Validates a redirect `location` header, resolving it against `base`.
 * Applies the same HTTPS + private-host + DNS checks as the initial URL.
 * Returns an error Response on any failure, or `{ url, ip }` on success.
 */
async function validateRedirectTarget(
  location: string | null,
  base: URL
): Promise<{ url: URL; ip: string } | Response> {
  if (!location) {
    return NextResponse.json({ message: "Invalid redirect" }, { status: 400 });
  }

  let nextUrl: URL;
  try {
    nextUrl = new URL(location, base.toString());
  } catch {
    return NextResponse.json(
      { message: "Invalid redirect location" },
      { status: 400 }
    );
  }

  if (nextUrl.protocol !== "https:" || isPrivateHost(nextUrl.hostname)) {
    return NextResponse.json(
      { message: "Invalid url parameter" },
      { status: 400 }
    );
  }

  try {
    const resolved = await resolveAndCheckPrivateIP(nextUrl.hostname);
    return { url: nextUrl, ip: resolved.ip };
  } catch {
    return NextResponse.json(
      { message: "Invalid url parameter" },
      { status: 400 }
    );
  }
}

/**
 * Maps a fetch-level Error to the appropriate HTTP error response.
 * AbortError → 504 Gateway Timeout; everything else → 502 Bad Gateway.
 */
function fetchErrorResponse(error: Error): Response {
  if (error.name === "AbortError") {
    return NextResponse.json({ message: "Gateway Timeout" }, { status: 504 });
  }
  return NextResponse.json({ message: "Fetch failed" }, { status: 502 });
}

/**
 * Performs a single fetch hop to `url` with IP-pinned connection and per-hop
 * timeout. Returns the raw Response, or an Error on timeout/network failure.
 */
async function fetchHop(url: URL, ip: string): Promise<Response | Error> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const agent = createPinnedAgent(ip, url.hostname);

  try {
    return await (
      fetch as (url: string, init: PinnedRequestInit) => Promise<Response>
    )(url.toString(), {
      dispatcher: agent,
      redirect: "manual",
      signal: controller.signal,
    }).catch((error: unknown) =>
      error instanceof Error ? error : new Error("Fetch failed")
    );
  } finally {
    clearTimeout(timeoutId);
    await agent.close();
  }
}

/**
 * Reads the response body up to MAX_BODY_BYTES. Uses the Content-Length header
 * as a fast-path check before streaming. Returns a Buffer on success, or an
 * error Response (413/502) if the body is absent or too large.
 */
async function readBoundedBody(response: Response): Promise<Buffer | Response> {
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "Response too large" },
      { status: 413 }
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return NextResponse.json({ message: "No response body" }, { status: 502 });
  }

  const chunks: Buffer[] = [];
  let totalBytes = 0;
  let done = false;

  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    if (chunk.value) {
      totalBytes += chunk.value.byteLength;
      if (totalBytes > MAX_BODY_BYTES) {
        await reader.cancel();
        return NextResponse.json(
          { message: "Response too large" },
          { status: 413 }
        );
      }
      chunks.push(Buffer.from(chunk.value));
    }
  }

  return Buffer.concat(chunks);
}

export async function GET(request: NextRequest) {
  // 1. Auth check — must run before any URL parsing or DNS work
  const authResult = await requireSessionForRoute();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { message: "Missing url parameter" },
      { status: 400 }
    );
  }

  // 2. Validate initial URL + resolve IP for connection pinning
  const validated = await validateAndResolveUrl(url);
  if (validated instanceof Response) {
    return validated;
  }

  let currentIp = validated.ip;
  let currentUrl = validated.url;
  let redirectCount = 0;

  // 3. Fetch loop — manual redirect handling with per-hop IP pinning
  while (true) {
    const fetchResult = await fetchHop(currentUrl, currentIp);

    if (fetchResult instanceof Error) {
      return fetchErrorResponse(fetchResult);
    }

    const response = fetchResult;

    // 3a. Manual redirect handling
    if (response.status >= 300 && response.status < 400) {
      if (redirectCount >= MAX_REDIRECTS) {
        return NextResponse.json(
          { message: "Too many redirects" },
          { status: 400 }
        );
      }

      const nextHop = await validateRedirectTarget(
        response.headers.get("location"),
        currentUrl
      );
      if (nextHop instanceof Response) {
        return nextHop;
      }

      currentUrl = nextHop.url;
      currentIp = nextHop.ip;
      redirectCount++;
      continue;
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: response.statusText },
        { status: response.status }
      );
    }

    // 4. Read bounded body and return
    const bodyResult = await readBoundedBody(response);
    if (bodyResult instanceof Response) {
      return bodyResult;
    }

    const html = bodyResult.toString("utf-8");
    return NextResponse.json({ data: html });
  }
}
