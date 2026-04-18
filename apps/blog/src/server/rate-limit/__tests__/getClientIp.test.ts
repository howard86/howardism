import { describe, expect, it } from "bun:test";

import { getClientIp } from "../getClientIp";

describe("getClientIp", () => {
  it("prefers x-vercel-forwarded-for over x-forwarded-for", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "203.0.113.5",
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      "x-real-ip": "9.9.9.9",
    });
    expect(getClientIp(headers)).toBe("203.0.113.5");
  });

  it("takes the first comma-separated entry of x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1, 10.0.0.1, 10.0.0.2",
    });
    expect(getClientIp(headers)).toBe("198.51.100.1");
  });

  it("trims whitespace around the x-forwarded-for entry", () => {
    const headers = new Headers({
      "x-forwarded-for": "   198.51.100.2   ,  10.0.0.1",
    });
    expect(getClientIp(headers)).toBe("198.51.100.2");
  });

  // Regression for #554 — two clients spoofing different leading XFF entries
  // must produce different rate-limit keys (otherwise they share a bucket and
  // bypass per-IP limits).
  it("returns distinct values for distinct leading XFF entries (regression #554)", () => {
    const a = getClientIp(
      new Headers({ "x-forwarded-for": "1.1.1.1, 9.9.9.9" })
    );
    const b = getClientIp(
      new Headers({ "x-forwarded-for": "2.2.2.2, 9.9.9.9" })
    );
    expect(a).not.toBe(b);
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.10" });
    expect(getClientIp(headers)).toBe("203.0.113.10");
  });

  it("returns 'anonymous' when no IP headers are present", () => {
    expect(getClientIp(new Headers())).toBe("anonymous");
  });

  it("returns 'anonymous' when x-forwarded-for is a padding string", () => {
    const headers = new Headers({ "x-forwarded-for": ",  , ," });
    expect(getClientIp(headers)).toBe("anonymous");
  });

  it("ignores x-vercel-forwarded-for when empty", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "",
      "x-forwarded-for": "198.51.100.3",
    });
    expect(getClientIp(headers)).toBe("198.51.100.3");
  });
});
