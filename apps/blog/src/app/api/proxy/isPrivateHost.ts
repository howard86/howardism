const V4_MAPPED_RE = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/;

export const isPrivateHost = (hostname: string): boolean => {
  if (hostname === "localhost") {
    return true;
  }

  // Strip brackets from IPv6 (URL parser gives "[::1]")
  const bare = hostname.startsWith("[") ? hostname.slice(1, -1) : hostname;

  // IPv6 checks
  if (bare.includes(":")) {
    const lower = bare.toLowerCase();
    // Loopback
    if (lower === "::1") {
      return true;
    }
    // Unspecified
    if (lower === "::") {
      return true;
    }
    // IPv4-mapped (::ffff:127.0.0.1, ::ffff:10.0.0.1, etc.)
    const v4Mapped = lower.match(V4_MAPPED_RE);
    if (v4Mapped) {
      return isPrivateIPv4(v4Mapped[1]);
    }
    // Unique local (fc00::/7)
    if (lower.startsWith("fc") || lower.startsWith("fd")) {
      return true;
    }
    // Link-local (fe80::/10)
    if (lower.startsWith("fe80")) {
      return true;
    }
    return false;
  }

  return isPrivateIPv4(bare);
};

const isPrivateIPv4 = (host: string): boolean => {
  const parts = host.split(".").map(Number);

  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
};
