import { describe, expect, it } from "bun:test";

import { enforceGlossary } from "../translate/enforce.ts";

describe("enforceGlossary", () => {
  it("does nothing when every term is already verbatim in the output", () => {
    const source = "Boris Cherny works on Claude Code.";
    const output = "Boris Cherny 在 Claude Code 上工作。";
    const result = enforceGlossary(output, source, [
      "Boris Cherny",
      "Claude Code",
    ]);
    expect(result.applied).toBe(0);
    expect(result.missing).toEqual([]);
    expect(result.text).toBe(output);
  });

  it("reports a term missing from the output when it cannot be safely repaired", () => {
    const source = "Boris Cherny is the IC voice on Claude Code at Anthropic.";
    // "Anthropic" was dropped mid-sentence — no link ties it to a unique
    // location, so it can only be reported, not repaired.
    const output = "鮑里斯是 Claude Code 上的 IC 代表聲音。";
    const result = enforceGlossary(output, source, [
      "Boris Cherny",
      "Claude Code",
      "Anthropic",
    ]);
    expect(result.applied).toBe(0);
    expect(result.missing).toEqual(["Boris Cherny", "Anthropic"]);
    expect(result.text).toBe(output);
  });

  it("repairs a mistranslated link anchor when the URL is preserved and unique", () => {
    const source =
      "See [Boris Cherny](/articles/boris-cherny) for the full profile.";
    const output = "參見 [鮑里斯](/articles/boris-cherny) 以獲取完整檔案。";
    const result = enforceGlossary(output, source, ["Boris Cherny"]);
    expect(result.applied).toBe(1);
    expect(result.missing).toEqual([]);
    expect(result.text).toBe(
      "參見 [Boris Cherny](/articles/boris-cherny) 以獲取完整檔案。"
    );
  });

  it("does not repair when the same URL is linked more than once (ambiguous)", () => {
    const source =
      "[Boris Cherny](/articles/boris-cherny) ... later again [Boris Cherny](/articles/boris-cherny).";
    const output =
      "[鮑里斯](/articles/boris-cherny) ... 後面又 [鮑里斯](/articles/boris-cherny)。";
    const result = enforceGlossary(output, source, ["Boris Cherny"]);
    expect(result.applied).toBe(0);
    expect(result.missing).toEqual(["Boris Cherny"]);
    // Conservative: leaves the ambiguous output untouched rather than
    // guessing which occurrence to fix.
    expect(result.text).toBe(output);
  });

  it("leaves an already-verbatim occurrence inside code/math untouched", () => {
    const source =
      "Config uses `AgentOpt` internally, see ```AgentOpt.run()``` below and $AgentOpt$ in the formula.";
    // "AgentOpt" only appears inside protected spans in the output — no
    // repair is needed since it's already verbatim there.
    const output =
      "設定內部使用 `代理選項` ，見下方 ```AgentOpt.run()``` 以及公式中的 $AgentOpt$。";
    const before = output;
    const result = enforceGlossary(output, source, ["AgentOpt"]);
    expect(result.text).toBe(before);
    expect(result.applied).toBe(0);
    expect(result.missing).toEqual([]);
  });

  it("refuses to repair a link anchor swap when the only match lives inside a fenced code block", () => {
    const source = "[AgentOpt](/articles/agentopt) is great.";
    // The only place a URL-matching link occurs in the output is INSIDE a
    // fenced code block (a contrived but real risk: repairing here would
    // corrupt a code sample). Case-sensitive matching also means the
    // lowercase URL slug never satisfies the "already present" check.
    const output =
      "這是一段程式碼範例：\n```text\n[代理](/articles/agentopt)\n```\n很棒。";
    const before = output;
    const result = enforceGlossary(output, source, ["AgentOpt"]);
    expect(result.applied).toBe(0);
    expect(result.missing).toEqual(["AgentOpt"]);
    expect(result.text).toBe(before);
  });

  it("skips empty/blank terms and dedupes repeated terms", () => {
    const source = "Boris Cherny and Boris Cherny again.";
    const output = "鮑里斯 和 鮑里斯 再次。";
    const result = enforceGlossary(output, source, [
      "",
      "  ",
      "Boris Cherny",
      "Boris Cherny",
    ]);
    expect(result.missing).toEqual(["Boris Cherny"]);
  });

  it("ignores terms that never appear in the source", () => {
    const source = "Nothing relevant here.";
    const output = "這裡沒有相關內容。";
    const result = enforceGlossary(output, source, ["Claude Code"]);
    expect(result.applied).toBe(0);
    expect(result.missing).toEqual([]);
  });

  it("is case-sensitive", () => {
    const source = "Anthropic ships Claude.";
    const output = "anthropic 推出了 Claude。";
    const result = enforceGlossary(output, source, ["Anthropic"]);
    expect(result.missing).toEqual(["Anthropic"]);
  });
});
