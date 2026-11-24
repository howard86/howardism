import { describe, expect, it } from "bun:test";

import { EMPTY_RELEASE_HISTORY } from "@howardism/article-contract/manifests/release-history";

import {
  digestArticle,
  recordRelease,
  type Snapshot,
  shortHash,
} from "../content/history";

const article = (
  body: string,
  sources: { title: string; url?: string }[] = [],
  extra = ""
): string =>
  `---\ntitle: T\n${extra}sources:\n${sources
    .map(
      (s) =>
        `  - title: ${JSON.stringify(s.title)}\n    url: ${s.url ?? "https://x.test"}`
    )
    .join("\n")}\n---\n\n${body}`;

const snap = (
  articles: Record<string, string>,
  resolved: Record<string, string[]> = {}
): Snapshot => ({
  articles: Object.fromEntries(
    Object.entries(articles).map(([k, v]) => [k, digestArticle(v)])
  ),
  resolved,
});

describe("body hash", () => {
  const base = article("Hello [a](https://a.test) world.\n");
  it("ignores frontmatter, hero export, generated Sources, link targets, whitespace", () => {
    const h = digestArticle(base).hash;
    expect(
      digestArticle(
        article("Hello [a](https://a.test) world.\n", [], "domain: x\n")
      ).hash
    ).toBe(h);
    expect(
      digestArticle(
        article(
          "export { default as heroImage } from './h.webp'\n\nHello [a](https://a.test) world.\n"
        )
      ).hash
    ).toBe(h);
    expect(
      digestArticle(
        article(
          "## Sources\n\n- [S](https://s.test)\n\nHello [a](https://a.test) world.\n"
        )
      ).hash
    ).toBe(h);
    expect(
      digestArticle(article("Hello [a](https://other.test/x) world.\n")).hash
    ).toBe(h);
    expect(
      digestArticle(article("Hello   [a](https://a.test)\n\n\nworld.")).hash
    ).toBe(h);
    expect(digestArticle(article("Hello [[slug-a|a]] world.\n")).hash).toBe(h);
  });
  it("counts real edits and a later author Sources section", () => {
    const h = digestArticle(base).hash;
    expect(
      digestArticle(article("Hello there [a](https://a.test) world.\n")).hash
    ).not.toBe(h);
    expect(
      digestArticle(
        article("Hello [a](https://a.test) world.\n\n## Sources\n\n- mine\n")
      ).hash
    ).not.toBe(h);
  });
});

describe("recordRelease", () => {
  it("tracks new, revised, deleted, sourcesGained", () => {
    const r1 = recordRelease(
      EMPTY_RELEASE_HISTORY,
      snap({ a: article("one", [{ title: "S1" }]), b: article("two") }),
      "2026-01-01"
    );
    expect(r1.release?.no).toBe(1);
    expect(r1.release?.new).toEqual(["a", "b"]);
    expect(r1.release?.sourcesGained).toEqual({ a: ["S1"] });
    const r2 = recordRelease(
      r1.history,
      snap({
        a: article("one changed", [{ title: "S1" }, { title: "S2" }]),
        b: article("two", [{ title: "Only sources" }]),
        c: article("three"),
      }),
      "2026-01-02"
    );
    expect(r2.release).toMatchObject({
      no: 2,
      new: ["c"],
      revised: ["a"],
      sourcesGained: { a: ["S2"] },
    });
    expect(r2.history.base).toEqual(r1.history.head);
    expect(r2.history.notes.a).toEqual({
      first: "2026-01-01",
      revised: "2026-01-02",
      revisions: ["2026-01-02"],
    });
    expect(r2.history.notes.b).toEqual({ first: "2026-01-01", revisions: [] });
    const r3 = recordRelease(
      r2.history,
      snap({
        a: article("one changed", [{ title: "S1" }, { title: "S2" }]),
        d: article("four"),
      }),
      "2026-01-03"
    );
    expect(r3.history.notes.b).toBeUndefined();
    expect(r3.history.head.bodies.b).toBeUndefined();
  });

  it("diffs resolved questions by text", () => {
    const s = snap({ a: article("x") }, { a: ["Q1"] });
    const r1 = recordRelease(EMPTY_RELEASE_HISTORY, s, "2026-01-01");
    expect(r1.release?.resolved).toEqual([{ slug: "a", text: "Q1" }]);
    const r2 = recordRelease(
      r1.history,
      snap({ a: article("x") }, { a: ["Q1", "Q2"] }),
      "2026-01-02"
    );
    expect(r2.release?.resolved).toEqual([{ slug: "a", text: "Q2" }]);
    expect(r2.history.head.resolved.a).toContain(shortHash("Q2"));
  });

  it("re-records the same date against base, keeping no", () => {
    const r1 = recordRelease(
      EMPTY_RELEASE_HISTORY,
      snap({ a: article("x") }),
      "2026-01-01"
    );
    const r2 = recordRelease(
      r1.history,
      snap({ a: article("x"), b: article("y") }),
      "2026-01-02"
    );
    const r3 = recordRelease(
      r2.history,
      snap({ a: article("x"), b: article("y"), c: article("z") }),
      "2026-01-02"
    );
    expect(r3.history.releases).toHaveLength(2);
    expect(r3.release).toMatchObject({ no: 2, new: ["b", "c"] });
    expect(r3.history.base).toEqual(r1.history.head);
  });

  it("skips when nothing changed", () => {
    const s = snap({ a: article("x") });
    const r1 = recordRelease(EMPTY_RELEASE_HISTORY, s, "2026-01-01");
    const r2 = recordRelease(r1.history, s, "2026-01-02");
    expect(r2.changed).toBe(false);
    expect(r2.history).toBe(r1.history);
  });
});
