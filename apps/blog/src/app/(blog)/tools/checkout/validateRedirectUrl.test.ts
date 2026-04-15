import { describe, expect, it } from "bun:test";
import { validateRedirectUrl } from "./validateRedirectUrl";

const ORIGIN = "https://example.com";

describe("validateRedirectUrl", () => {
  // Same-origin: always allowed
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

  it("allows same-origin URL with path and query string", () => {
    const url = validateRedirectUrl(
      "https://example.com/checkout/success?ref=123",
      ORIGIN
    );
    expect(url).toBe("https://example.com/checkout/success?ref=123");
  });

  // LINE Pay trusted hosts: https only
  it("allows prod LINE Pay host (https)", () => {
    const url = validateRedirectUrl(
      "https://web-pay.line.me/pay/confirm?transactionId=123",
      ORIGIN
    );
    expect(url).toBe("https://web-pay.line.me/pay/confirm?transactionId=123");
  });

  it("allows sandbox LINE Pay host (https)", () => {
    const url = validateRedirectUrl(
      "https://sandbox-web-pay.line.me/pay/confirm?transactionId=456",
      ORIGIN
    );
    expect(url).toBe(
      "https://sandbox-web-pay.line.me/pay/confirm?transactionId=456"
    );
  });

  it("throws for LINE Pay host over http (must be https)", () => {
    expect(() =>
      validateRedirectUrl("http://web-pay.line.me/pay/confirm", ORIGIN)
    ).toThrow("Redirect to external URL is not allowed");
  });

  it("throws for LINE Pay sandbox host over http (must be https)", () => {
    expect(() =>
      validateRedirectUrl("http://sandbox-web-pay.line.me/pay/confirm", ORIGIN)
    ).toThrow("Redirect to external URL is not allowed");
  });

  // Untrusted external hosts: always rejected
  it("throws for untrusted external URLs", () => {
    expect(() => validateRedirectUrl("https://evil.com/", ORIGIN)).toThrow(
      "Redirect to external URL is not allowed"
    );
  });

  it("throws for protocol-relative URLs that point to a different host", () => {
    expect(() => validateRedirectUrl("//evil.com/steal", ORIGIN)).toThrow(
      "Redirect to external URL is not allowed"
    );
  });

  // Pseudo-protocols: always rejected
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

  it("throws for file: URLs", () => {
    expect(() => validateRedirectUrl("file:///etc/passwd", ORIGIN)).toThrow(
      "Redirect to external URL is not allowed"
    );
  });

  it("throws for vbscript: URLs", () => {
    expect(() => validateRedirectUrl("vbscript:msgbox(1)", ORIGIN)).toThrow(
      "Redirect to external URL is not allowed"
    );
  });
});
