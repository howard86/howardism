import { describe, expect, it } from "bun:test";

import {
  categorise,
  humanBytes,
  MARKER,
  type Report,
  renderComparison,
} from "../../../scripts/export-size";

const report = (bytes: number, gzip = bytes / 3): Report => ({
  totals: { js: { files: 2, bytes, gzip } },
  total: { files: 2, bytes, gzip },
  assets: {
    "_next/static/chunks/a.js": { bytes, gzip },
  },
});

describe("categorise", () => {
  it("maps extensions to categories", () => {
    expect(categorise("_next/static/a.js")).toBe("js");
    expect(categorise("a/b.css")).toBe("css");
    expect(categorise("index.html")).toBe("html");
    expect(categorise("x.WEBP")).toBe("images");
    expect(categorise("f.woff2")).toBe("fonts");
    expect(categorise("a/__next.txt")).toBe("data");
    expect(categorise("rss/feed.json")).toBe("data");
    expect(categorise("a.map")).toBe("other");
  });
});

describe("humanBytes", () => {
  it("uses base-1000 units with one decimal", () => {
    expect(humanBytes(999)).toBe("999 B");
    expect(humanBytes(1500)).toBe("1.5 kB");
    expect(humanBytes(2_500_000)).toBe("2.5 MB");
    expect(humanBytes(-1500)).toBe("-1.5 kB");
  });
});

describe("renderComparison", () => {
  it("starts with the marker", () => {
    expect(renderComparison(undefined, report(1000)).split("\n")[0]).toBe(
      MARKER
    );
  });

  it("renders head only when base is missing", () => {
    const md = renderComparison(undefined, report(1000));
    expect(md).toContain("No base report");
    expect(md).toContain("n/a");
    expect(md).not.toContain("⚠️");
  });

  it("shows zero delta without a warning", () => {
    const md = renderComparison(report(100_000), report(100_000));
    expect(md).toContain("0 B (0.0%)");
    expect(md).not.toContain("⚠️");
  });

  it("warns at >=5% or >=10 kB", () => {
    const pct = renderComparison(report(100_000), report(105_000));
    expect(pct).toContain("+5.0 kB (+5.0%) ⚠️");
    const abs = renderComparison(report(10_000_000), report(10_010_000));
    expect(abs).toContain("+10.0 kB (+0.1%) ⚠️");
    const small = renderComparison(report(100_000), report(104_000));
    expect(small).not.toContain("⚠️");
  });

  it("lists added and removed js assets", () => {
    const head = report(1000);
    head.assets = { "_next/static/chunks/b.js": { bytes: 1, gzip: 1 } };
    const md = renderComparison(report(1000), head);
    expect(md).toContain("added: 1, removed: 1");
  });
});
