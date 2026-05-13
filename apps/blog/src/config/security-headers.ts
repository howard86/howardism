export interface SecurityHeader {
  key: string;
  value: string;
}

export type CspDirectiveName =
  | "default-src"
  | "script-src"
  | "script-src-elem"
  | "script-src-attr"
  | "style-src"
  | "style-src-elem"
  | "style-src-attr"
  | "img-src"
  | "font-src"
  | "connect-src"
  | "media-src"
  | "object-src"
  | "frame-src"
  | "frame-ancestors"
  | "base-uri"
  | "form-action"
  | "manifest-src"
  | "worker-src"
  | "child-src"
  | "report-uri"
  | "report-to"
  | "upgrade-insecure-requests"
  | "block-all-mixed-content";

export type CspDirectives = Partial<
  Record<CspDirectiveName, readonly string[] | true>
>;

export interface SecurityHeaderOptions {
  /**
   * CSP directives. When `undefined`, the default policy is emitted.
   * Pass `false` to suppress the CSP header entirely.
   * Pass a full directives object to replace the default wholesale (no merge).
   */
  contentSecurityPolicy?: CspDirectives | false;
  /**
   * When `true`, emit `Content-Security-Policy-Report-Only` instead of the
   * enforcing header. Defaults to `false`.
   */
  cspReportOnly?: boolean;
  /**
   * Controls the `geolocation=` token inside `Permissions-Policy`. Pass `"()"`
   * to deny all, `"(self)"` to allow the page's own origin.
   */
  geolocation: "()" | "(self)";
  /**
   * When `true`, omit the headers that force HTTPS — `Strict-Transport-Security`
   * and the `upgrade-insecure-requests` CSP directive. The dev server is plain
   * HTTP and Safari honours HSTS (and request upgrades) on `localhost`, so
   * leaving these on makes Safari refuse to connect over HTTP with a TLS
   * handshake error. Only strips `upgrade-insecure-requests` from the default
   * directives; an explicitly passed `contentSecurityPolicy` is left untouched.
   * Defaults to `false`.
   */
  insecureTransport?: boolean;
}

export const DEFAULT_CSP_DIRECTIVES: CspDirectives = Object.freeze({
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

const BARE_DIRECTIVES = new Set<CspDirectiveName>([
  "upgrade-insecure-requests",
  "block-all-mixed-content",
]);

export function serializeCsp(directives: CspDirectives): string {
  const parts: string[] = [];
  for (const [rawName, value] of Object.entries(directives)) {
    if (value === undefined) {
      continue;
    }
    const name = rawName as CspDirectiveName;
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

export function getSecurityHeaders({
  geolocation,
  contentSecurityPolicy,
  cspReportOnly = false,
  insecureTransport = false,
}: SecurityHeaderOptions): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-XSS-Protection", value: "0" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: `camera=(), microphone=(), geolocation=${geolocation}`,
    },
  ];

  if (!insecureTransport) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains",
    });
  }

  if (contentSecurityPolicy === false) {
    return headers;
  }

  let directives = contentSecurityPolicy ?? DEFAULT_CSP_DIRECTIVES;
  if (insecureTransport && directives === DEFAULT_CSP_DIRECTIVES) {
    const { "upgrade-insecure-requests": _omit, ...rest } =
      DEFAULT_CSP_DIRECTIVES;
    directives = rest;
  }
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
