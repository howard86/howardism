import { describe, expect, it } from "bun:test";
import { validateRedirectUrl } from "./validateRedirectUrl";

const ORIGIN = "https://example.com";

describe("validateRedirectUrl", () => {
  it("allows relative paths", () => {
    expect(validateRedirectUrl("/success", ORIGIN)).toBe(
      "https://example.com/success"
    );
  });

  it("allows same-origin absolute URLs", () => {
    expect(validateRedirectUrl("https://example.com/done", ORIGIN)).toBe(
      "https://example.com/done"
    );
  });

  it("throws for external URLs", () => {
    expect(() => validateRedirectUrl("https://evil.com/", ORIGIN)).toThrow(
      "Redirect to external URL is not allowed"
    );
  });

  it("throws for protocol-relative URLs that point to a different host", () => {
    expect(() => validateRedirectUrl("//evil.com/steal", ORIGIN)).toThrow(
      "Redirect to external URL is not allowed"
    );
  });

  it("throws for javascript: URLs", () => {
    expect(() => validateRedirectUrl("javascript:alert(1)", ORIGIN)).toThrow(
      "Redirect to external URL is not allowed"
    );
  });

  it("throws for data: URLs", () => {
    expect(() =>
      validateRedirectUrl("data:text/html,<script>alert(1)</script>", ORIGIN)
    ).toThrow("Redirect to external URL is not allowed");
  });

  it("allows same-origin URL with path and query string", () => {
    const url = validateRedirectUrl(
      "https://example.com/checkout/success?ref=123",
      ORIGIN
    );
    expect(url).toBe("https://example.com/checkout/success?ref=123");
  });
});
