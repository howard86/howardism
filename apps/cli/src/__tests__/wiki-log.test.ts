import { describe, expect, it } from "bun:test";

import { buildWikiLog } from "../import-wiki/pages/wiki-log.ts";

describe("buildWikiLog", () => {
  it("parses entries newest-first", () => {
    const body = [
      "Preamble text.",
      "",
      "## [2026-05-01] ingest | First Entry",
      "Body of first.",
      "",
      "## [2026-05-10] query | Second Entry",
      "Body of second.",
    ].join("\n");

    const log = buildWikiLog({ body, generatedOn: "2026-05-14" });

    expect(log.entries).toHaveLength(2);
    expect(log.entries[0].date).toBe("2026-05-10");
    expect(log.entries[0].operation).toBe("query");
    expect(log.entries[0].subject).toBe("Second Entry");
    expect(log.entries[1].date).toBe("2026-05-01");
    expect(log.entries[1].operation).toBe("ingest");
    expect(log.entries[1].subject).toBe("First Entry");
  });

  it("sets generatedOn as date-only string", () => {
    const log = buildWikiLog({
      body: "## [2026-01-01] lint | X\nbody",
      generatedOn: "2026-05-14",
    });

    expect(log.generatedOn).toBe("2026-05-14");
  });

  it("extracts refs from entry body, deduped, in document order", () => {
    const body = [
      "## [2026-05-01] ingest | Refs Test",
      "See [[alpha]] and [[beta]].",
      "Also [[alpha]] again and [[raw/external]] ignored.",
      "Then [[gamma]].",
    ].join("\n");

    const log = buildWikiLog({ body, generatedOn: "2026-05-14" });

    expect(log.entries[0].refs).toEqual(["alpha", "beta", "gamma"]);
  });

  it("preserves stable order for entries with equal dates", () => {
    const body = [
      "## [2026-05-01] ingest | A",
      "body a",
      "",
      "## [2026-05-01] query | B",
      "body b",
      "",
      "## [2026-05-01] lint | C",
      "body c",
    ].join("\n");

    const log = buildWikiLog({ body, generatedOn: "2026-05-14" });

    // Same date → stable sort preserves document (parse) order
    expect(log.entries.map((e) => e.subject)).toEqual(["A", "B", "C"]);
  });

  it("returns empty entries for body with no headings", () => {
    const log = buildWikiLog({
      body: "Just some text without any entry headings.",
      generatedOn: "2026-05-14",
    });

    expect(log.entries).toEqual([]);
  });
});
