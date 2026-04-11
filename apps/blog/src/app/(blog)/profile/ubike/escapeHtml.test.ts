import { describe, expect, it } from "bun:test";
import { escapeHtml } from "./escapeHtml";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b");
  });

  it("escapes less-than", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes greater-than", () => {
    expect(escapeHtml("a>b")).toBe("a&gt;b");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("台北車站")).toBe("台北車站");
  });

  it("escapes a full XSS payload", () => {
    const payload = '<img src=x onerror="alert(1)">';
    expect(escapeHtml(payload)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});
