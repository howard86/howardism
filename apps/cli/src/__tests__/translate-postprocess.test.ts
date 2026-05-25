import { describe, expect, it } from "bun:test";

import { fixMdxEscaping } from "../translate/postprocess.ts";

describe("fixMdxEscaping — brace escaping", () => {
  it("escapes bare { and } in prose", () => {
    expect(fixMdxEscaping("foo {bar} baz")).toBe("foo \\{bar\\} baz");
  });

  it("does not double-escape already-escaped braces", () => {
    expect(fixMdxEscaping("foo \\{bar\\} baz")).toBe("foo \\{bar\\} baz");
  });

  it("escapes unescaped braces in LaTeX-like prose", () => {
    expect(fixMdxEscaping("$f(x) = {x + 1}$")).toBe("$f(x) = \\{x + 1\\}$");
  });

  it("does not re-escape already-escaped LaTeX braces", () => {
    const input = "$\\mathrm\\{Elo\\}_s = 1200$";
    expect(fixMdxEscaping(input)).toBe(input);
  });
});

describe("fixMdxEscaping — < before digit or $", () => {
  it("replaces < before a digit with &lt;", () => {
    expect(fixMdxEscaping("costs <50 words")).toBe("costs &lt;50 words");
  });

  it("replaces < before $ with &lt;", () => {
    expect(fixMdxEscaping("under <$100")).toBe("under &lt;$100");
  });

  it("does not replace < before a letter", () => {
    expect(fixMdxEscaping("see <a>")).toBe("see <a>");
  });

  it("does not double-encode &lt; already in source", () => {
    expect(fixMdxEscaping("cost &lt;$50")).toBe("cost &lt;$50");
  });

  it("handles multiple occurrences on one line", () => {
    expect(fixMdxEscaping("<5% overhead or <$10")).toBe(
      "&lt;5% overhead or &lt;$10"
    );
  });
});

describe("fixMdxEscaping — skip zones", () => {
  it("leaves inline code spans untouched", () => {
    const input = "prose `{foo}` end";
    expect(fixMdxEscaping(input)).toBe(input);
  });

  it("leaves fenced code blocks untouched", () => {
    const input = "before\n```\nlet x = {a: 1};\n```\nafter";
    expect(fixMdxEscaping(input)).toBe(input);
  });

  it("leaves tilde-fenced code blocks untouched", () => {
    const input = "before\n~~~\nx = {}\n~~~\nafter";
    expect(fixMdxEscaping(input)).toBe(input);
  });

  it("leaves frontmatter untouched", () => {
    const input = "---\ntitle: {foo}\ndate: 2026-01-01\n---\nprose {bar}";
    expect(fixMdxEscaping(input)).toBe(
      "---\ntitle: {foo}\ndate: 2026-01-01\n---\nprose \\{bar\\}"
    );
  });

  it("leaves export lines untouched (heroImage export uses real JS braces)", () => {
    const input = 'export { default as heroImage } from "../assets/foo.png";';
    expect(fixMdxEscaping(input)).toBe(input);
  });

  it("leaves import lines untouched", () => {
    const input = 'import { Foo } from "./foo";';
    expect(fixMdxEscaping(input)).toBe(input);
  });
});

describe("fixMdxEscaping — idempotency", () => {
  it("running twice equals running once", () => {
    const input =
      "foo {bar} baz <50 words `code {x}` end\n```\n{}\n```\n\\{already\\}";
    const once = fixMdxEscaping(input);
    expect(fixMdxEscaping(once)).toBe(once);
  });

  it("is a no-op on already-correct MDX", () => {
    const input =
      '---\ntitle: clean\n---\nexport { default as heroImage } from "../assets/x.png";\n\nprose with &lt;5% and \\{escaped\\}';
    expect(fixMdxEscaping(input)).toBe(input);
  });
});

describe("fixMdxEscaping — CRLF preservation", () => {
  it("preserves CRLF line endings on modified lines", () => {
    const input = "foo {bar}\r\n";
    const result = fixMdxEscaping(input);
    expect(result).toBe("foo \\{bar\\}\r\n");
  });

  it("does not add CR to LF-only lines", () => {
    const input = "foo {bar}\n";
    const result = fixMdxEscaping(input);
    expect(result).toBe("foo \\{bar\\}\n");
  });
});
