/**
 * @typedef {import("./index.d.ts").SecurityHeader} SecurityHeader
 * @typedef {import("./index.d.ts").CspDirectives} CspDirectives
 * @typedef {import("./index.d.ts").SecurityHeaderOptions} SecurityHeaderOptions
 */

/** @type {CspDirectives} */
export const DEFAULT_CSP_DIRECTIVES = Object.freeze({
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "https:", "data:", "blob:"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'", "https:"],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"],
  "upgrade-insecure-requests": true,
});

const BARE_DIRECTIVES = new Set([
  "upgrade-insecure-requests",
  "block-all-mixed-content",
]);

/**
 * @param {CspDirectives} directives
 * @returns {string}
 */
export function serializeCsp(directives) {
  const parts = [];
  for (const [name, value] of Object.entries(directives)) {
    if (value === true) {
      if (!BARE_DIRECTIVES.has(name)) {
        throw new Error(
          `CSP directive "${name}" does not support bare (value-less) form`
        );
      }
      parts.push(name);
      continue;
    }
    if (!Array.isArray(value) || value.length === 0) {
      continue;
    }
    parts.push(`${name} ${value.join(" ")}`);
  }
  return parts.join("; ");
}

/**
 * @param {SecurityHeaderOptions} options
 * @returns {SecurityHeader[]}
 */
export function getSecurityHeaders({
  geolocation,
  contentSecurityPolicy,
  cspReportOnly = false,
}) {
  /** @type {SecurityHeader[]} */
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-XSS-Protection", value: "0" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    },
    {
      key: "Permissions-Policy",
      value: `camera=(), microphone=(), geolocation=${geolocation}`,
    },
  ];

  if (contentSecurityPolicy === false) {
    return headers;
  }

  const directives = contentSecurityPolicy ?? DEFAULT_CSP_DIRECTIVES;
  const cspValue = serializeCsp(directives);
  if (cspValue.length > 0) {
    headers.push({
      key: cspReportOnly
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy",
      value: cspValue,
    });
  }

  return headers;
}
