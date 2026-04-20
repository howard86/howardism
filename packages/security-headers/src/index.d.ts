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
}

/**
 * Default CSP used when `contentSecurityPolicy` is omitted. Exported so apps
 * can spread + override a subset of directives without rebuilding the whole
 * policy from scratch.
 */
export const DEFAULT_CSP_DIRECTIVES: CspDirectives;

/**
 * Serialise a CspDirectives object into a single header value, e.g.
 * `"default-src 'self'; script-src 'self' 'unsafe-inline'"`. Directives whose
 * value is `true` are emitted as bare tokens (`upgrade-insecure-requests`).
 */
export function serializeCsp(directives: CspDirectives): string;

/**
 * Build the Next.js `headers()` array shared by every Howardism Next.js app.
 */
export function getSecurityHeaders(
  options: SecurityHeaderOptions
): SecurityHeader[];
