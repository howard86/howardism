import { describe, expect, it } from "bun:test";

import {
  fixMdxEscaping,
  repairTranslatedFrontmatter,
} from "../translate/postprocess.ts";

describe("fixMdxEscaping — brace escaping", () => {
  it("escapes bare { and } in prose", () => {
    expect(fixMdxEscaping("foo {bar} baz")).toBe("foo \\{bar\\} baz");
  });

  it("does not double-escape already-escaped braces", () => {
    expect(fixMdxEscaping("foo \\{bar\\} baz")).toBe("foo \\{bar\\} baz");
  });

  it("collapses a doubled backslash before a brace or pipe", () => {
    expect(fixMdxEscaping("in \\\\{1..N\\\\} set")).toBe("in \\{1..N\\} set");
    expect(fixMdxEscaping("| mean \\\\|ρ\\\\| | > 0 |")).toBe(
      "| mean \\|ρ\\| | > 0 |"
    );
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

describe("fixMdxEscaping — fast path", () => {
  it("leaves a line with none of { } < ` untouched", () => {
    const input = "plain prose with nothing to fix";
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

describe("repairTranslatedFrontmatter", () => {
  const body =
    "\nexport { default as heroImage } from '../assets/x.webp'\n\n## 摘要\n";

  it("re-quotes a folded plain description whose continuation gained `: `", () => {
    const broken = [
      "---",
      "date: 2026-06-07",
      "title: 代理的誠實與勤勉",
      "description: 隨著模型能力提升，未能呈現與決策相關的資訊",
      "  從能力失誤轉為對齊失誤; Opus 4.8: 首個從不誤報",
      "tag: Concept",
      "---",
      body,
    ].join("\n");
    const repaired = repairTranslatedFrontmatter(broken);
    expect(repaired).toContain(
      'description: "隨著模型能力提升，未能呈現與決策相關的資訊 從能力失誤轉為對齊失誤; Opus 4.8: 首個從不誤報"'
    );
    expect(repaired).toContain('title: "代理的誠實與勤勉"');
    expect(repaired).toContain("date: 2026-06-07\n");
    expect(repaired.endsWith(body)).toBe(true);
  });

  it("dedents an indented top-level key instead of folding it into the title", () => {
    // The engine's real failure: `bad indentation of a mapping entry` at 4:13.
    const broken = [
      "---",
      "date: 2026-06-07",
      "title: 標題",
      " description: 隨著模型能力提升",
      "tag: Concept",
      "---",
      body,
    ].join("\n");
    const repaired = repairTranslatedFrontmatter(broken);
    expect(repaired).toContain('title: "標題"');
    expect(repaired).toContain('description: "隨著模型能力提升"');
  });

  it("stops a continuation at an indented top-level key", () => {
    const broken = [
      "---",
      "title: 標題",
      "description: 隨著模型",
      "  能力提升: 失誤",
      "  imageAlt: 插圖",
      "---",
      body,
    ].join("\n");
    const repaired = repairTranslatedFrontmatter(broken);
    expect(repaired).toContain('description: "隨著模型 能力提升: 失誤"');
    expect(repaired).toContain('imageAlt: "插圖"');
  });

  it("returns valid frontmatter unchanged", () => {
    const ok = [
      "---",
      "title: 標題",
      "description: 一段描述",
      "---",
      body,
    ].join("\n");
    expect(repairTranslatedFrontmatter(ok)).toBe(ok);
  });

  it("leaves an already-quoted value alone and gives up when repair cannot help", () => {
    const hopeless = ["---", 'title: "未閉合', "tags: [a, b", "---", body].join(
      "\n"
    );
    expect(repairTranslatedFrontmatter(hopeless)).toBe(hopeless);
  });

  it("repairs imageAlt with an unescaped leading quote", () => {
    const broken = ["---", 'imageAlt: "引號" 之後的文字', "---", body].join(
      "\n"
    );
    // Starts with a quote, so it is treated as quoted and left for validation.
    expect(repairTranslatedFrontmatter(broken)).toBe(broken);
  });
});
