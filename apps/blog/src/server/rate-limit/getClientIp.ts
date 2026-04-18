const ANONYMOUS = "anonymous";

/**
 * Resolve a caller's IP for rate-limit keying.
 *
 * Precedence:
 *   1. `x-vercel-forwarded-for` — set by Vercel's edge network AFTER discarding
 *      whatever the client sent. Not spoofable from the client. Preferred.
 *   2. First comma-separated entry of `x-forwarded-for` — matches the
 *      `api-rate-limiting` spec §15. Note: in a Vercel-append model the LAST
 *      entry is more trustworthy, but `x-vercel-forwarded-for` already covers
 *      that case, so this branch only fires in non-Vercel environments where
 *      the upstream-proxy contract determines trust.
 *   3. `x-real-ip` — single-value fallback used by some reverse proxies.
 *   4. Literal `"anonymous"` — no header at all (e.g. local dev curl).
 *
 * The function trims whitespace and rejects empty strings so a header of
 * `", , ,"` degrades to `"anonymous"` rather than becoming a zero-length
 * rate-limit key that would collide across callers.
 */
export function getClientIp(headers: Headers): string {
  const vercel = firstNonEmpty(headers.get("x-vercel-forwarded-for"));
  if (vercel !== null) {
    return vercel;
  }

  const xff = firstNonEmpty(headers.get("x-forwarded-for"));
  if (xff !== null) {
    return xff;
  }

  const real = headers.get("x-real-ip")?.trim();
  if (real) {
    return real;
  }

  return ANONYMOUS;
}

function firstNonEmpty(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return null;
}
