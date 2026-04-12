import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireSessionForRoute } from "@/lib/auth";
import { isPrivateHost, resolveAndCheckPrivateIP } from "./isPrivateHost";

const urlSchema = z.string().url();

/** Abort upstream fetch after this many milliseconds. */
const FETCH_TIMEOUT_MS = 5000;

/** Maximum allowed response body size in bytes (1 MB). */
const MAX_BODY_BYTES = 1_000_000;

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

  const result = urlSchema.safeParse(url);

  if (!result.success) {
    return NextResponse.json(
      { message: "Invalid url parameter" },
      { status: 400 }
    );
  }

  const parsed = new URL(url);

  // 2. String-based SSRF guard (PR #503 — keep in place)
  if (parsed.protocol !== "https:" || isPrivateHost(parsed.hostname)) {
    return NextResponse.json(
      { message: "Invalid url parameter" },
      { status: 400 }
    );
  }

  // 3. DNS resolve-and-check guard (runs after string check, not instead)
  try {
    await resolveAndCheckPrivateIP(parsed.hostname);
  } catch {
    return NextResponse.json(
      { message: "Invalid url parameter" },
      { status: 400 }
    );
  }

  // 4. Fetch with AbortController timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const fetchResult = await fetch(url, { signal: controller.signal }).catch(
    (error: unknown) =>
      error instanceof Error ? error : new Error("Fetch failed")
  );
  clearTimeout(timeoutId);

  if (fetchResult instanceof Error) {
    if (fetchResult.name === "AbortError") {
      return NextResponse.json({ message: "Gateway Timeout" }, { status: 504 });
    }
    return NextResponse.json({ message: "Fetch failed" }, { status: 502 });
  }

  const response = fetchResult;

  if (!response.ok) {
    return NextResponse.json(
      { message: response.statusText },
      { status: response.status }
    );
  }

  // 5. Response size cap — Content-Length header fast-path
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "Response too large" },
      { status: 413 }
    );
  }

  // 6. Stream body with rolling byte counter
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

  const html = Buffer.concat(chunks).toString("utf-8");

  return NextResponse.json({ data: html });
}
