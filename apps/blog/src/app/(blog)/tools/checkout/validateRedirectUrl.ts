import { TRUSTED_LINE_PAY_HOSTS } from "./trustedLinePayHosts";

const PSEUDO_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
]);

export const validateRedirectUrl = (data: string, origin: string): string => {
  // Reject pseudo-protocols before URL parsing — `new URL("javascript:alert(1)", origin)`
  // resolves with protocol "javascript:" but some environments may vary.
  const lower = data.trimStart().toLowerCase();
  for (const proto of PSEUDO_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      throw new Error("Redirect to external URL is not allowed");
    }
  }

  const redirectUrl = new URL(data, origin);

  // Double-check after parsing: reject any pseudo-protocol that slipped through.
  if (PSEUDO_PROTOCOLS.has(redirectUrl.protocol)) {
    throw new Error("Redirect to external URL is not allowed");
  }

  // Allow same-origin.
  if (redirectUrl.origin === origin) {
    return redirectUrl.href;
  }

  // Allow trusted LINE Pay hosts over https only.
  if (
    redirectUrl.protocol === "https:" &&
    (TRUSTED_LINE_PAY_HOSTS as readonly string[]).includes(redirectUrl.hostname)
  ) {
    return redirectUrl.href;
  }

  throw new Error("Redirect to external URL is not allowed");
};
