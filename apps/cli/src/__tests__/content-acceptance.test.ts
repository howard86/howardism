import { afterEach, describe, expect, it } from "bun:test";
import {
  preparationFromLog,
  scanBuildBytes,
  verifyBuildPair,
} from "../content/build-evidence";
import {
  compareDeployments,
  semanticSnapshot,
  validateParitySpec,
} from "../content/deployment-parity";

const digest = "a".repeat(64);
const tree = "b".repeat(64);
const commit = "c".repeat(40);
const lock = { schemaVersion: 1, releaseSha256: digest };
const marker = {
  schemaVersion: 1,
  profile: "full",
  applicationCommit: commit,
  releaseSha256: digest,
  materializedTreeSha256: tree,
};
const preparation = (cacheMisses: number, downloadedBytes: number) => ({
  contentPreparation: {
    profile: "full",
    requiredObjects: 10,
    cacheHits: cacheMisses === 0 ? 10 : 0,
    cacheMisses,
    downloadedBytes,
    verificationFailures: 0,
  },
  releaseSha256: digest,
});
const encode = (text: string) => new TextEncoder().encode(text);

it("requires exactly one machine-readable preparation receipt", () => {
  const record = preparation(10, 100);
  expect(
    preparationFromLog(`build output\n${JSON.stringify(record)}\n`)
  ).toEqual(record);
  expect(() => preparationFromLog("build output only")).toThrow();
  expect(() =>
    preparationFromLog(`${JSON.stringify(record)}\n${JSON.stringify(record)}`)
  ).toThrow();
});

it("rejects sample markers and mismatched pins", () => {
  expect(() =>
    verifyBuildPair(
      preparation(10, 100),
      preparation(0, 0),
      marker,
      { ...marker, profile: "sample" },
      lock,
      commit
    )
  ).toThrow();
  expect(() =>
    verifyBuildPair(
      preparation(10, 100),
      preparation(0, 0),
      marker,
      marker,
      { ...lock, releaseSha256: tree },
      commit
    )
  ).toThrow();
  expect(() =>
    verifyBuildPair(
      preparation(10, 100),
      preparation(0, 0),
      marker,
      marker,
      lock,
      "d".repeat(40)
    )
  ).toThrow();
});

it("rejects warm downloads and unexpected cold cache hits", () => {
  expect(() =>
    verifyBuildPair(
      preparation(10, 100),
      preparation(1, 1),
      marker,
      marker,
      lock,
      commit
    )
  ).toThrow("Warm build downloaded");
  expect(() =>
    verifyBuildPair(
      preparation(0, 0),
      preparation(0, 0),
      marker,
      marker,
      lock,
      commit
    )
  ).toThrow("Cold build did not reconstruct");
  expect(
    verifyBuildPair(
      preparation(10, 100),
      preparation(0, 0),
      marker,
      marker,
      lock,
      commit
    ).releaseSha256
  ).toBe(digest);
});

it("rejects secrets without printing them", () => {
  const secret = "very-private-token-123";
  expect(() =>
    scanBuildBytes(encode(`prefix ${secret} suffix`), [secret])
  ).toThrow("Credential found");
  try {
    scanBuildBytes(encode(secret), [secret]);
  } catch (error) {
    expect(String(error)).not.toContain(secret);
  }
  expect(() => scanBuildBytes(encode("@aws-sdk/client-s3"), [secret])).toThrow(
    "Publication tooling"
  );
});

const probes = [
  { kind: "visible-article", path: "/articles/visible" },
  { kind: "archived-article", path: "/articles/archived" },
  { kind: "on-demand-article", path: "/articles/on-demand" },
  { kind: "translated-article", path: "/zh-TW/articles/visible" },
  { kind: "graph-page", path: "/articles/visible" },
  { kind: "search-shell", path: "/articles" },
  { kind: "rss-json", path: "/rss/feed.json" },
  { kind: "rss-xml", path: "/rss/feed.xml" },
  { kind: "sitemap", path: "/sitemap.xml" },
  { kind: "image", path: "/image.webp" },
] as const;

describe("deployment parity", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("requires all acceptance categories", () => {
    expect(() =>
      validateParitySpec({ schemaVersion: 1, probes: probes.slice(1) })
    ).toThrow();
    expect(
      validateParitySpec({ schemaVersion: 1, probes }).probes
    ).toHaveLength(10);
  });

  it("compares semantic HTML and detects changed headings", () => {
    const baseline = semanticSnapshot(
      "visible-article",
      encode(
        '<title>Article</title><h1>Hello</h1><meta name="description" content="Summary"><link rel="canonical" href="/articles/visible"><img src="/image.webp" alt="Hero">'
      )
    );
    const changed = semanticSnapshot(
      "visible-article",
      encode(
        '<title>Article</title><h1>Changed</h1><meta name="description" content="Summary"><link rel="canonical" href="/articles/visible"><img src="/image.webp" alt="Hero">'
      )
    );
    expect(baseline).not.toEqual(changed);
  });

  it("preserves wrong external canonical hosts and normalizes only deployment origins", () => {
    const html = (canonical: string) =>
      encode(
        `<title>Article</title><h1>Heading</h1><meta name="description" content="Summary"><link rel="canonical" href="${canonical}"><img src="/image.webp" alt="Hero">`
      );
    const baselineOrigin = new URL("https://baseline.example");
    const candidateOrigin = new URL("https://candidate.example");
    expect(
      semanticSnapshot(
        "visible-article",
        html("https://baseline.example/articles/visible"),
        baselineOrigin
      )
    ).toEqual(
      semanticSnapshot(
        "visible-article",
        html("https://candidate.example/articles/visible"),
        candidateOrigin
      )
    );
    expect(
      semanticSnapshot(
        "visible-article",
        html("https://correct.example/articles/visible"),
        baselineOrigin
      )
    ).not.toEqual(
      semanticSnapshot(
        "visible-article",
        html("https://wrong.example/articles/visible"),
        candidateOrigin
      )
    );
    expect(
      semanticSnapshot(
        "visible-article",
        html("//correct.example/articles/visible"),
        baselineOrigin
      )
    ).not.toEqual(
      semanticSnapshot(
        "visible-article",
        html("//wrong.example/articles/visible"),
        candidateOrigin
      )
    );
  });

  it("records unavailable baseline categories without pretending they ran", () => {
    const naProbes = probes.map((probe) =>
      probe.kind === "archived-article" || probe.kind === "on-demand-article"
        ? {
            kind: probe.kind,
            notApplicable: {
              reason: "Baseline contains no eligible article",
              baselineEvidence: "sha256:baseline-inventory-receipt",
            },
          }
        : probe
    );
    const spec = validateParitySpec({ schemaVersion: 1, probes: naProbes });
    expect(
      spec.probes.filter((probe) => "notApplicable" in probe)
    ).toHaveLength(2);
    expect(() =>
      validateParitySpec({
        schemaVersion: 1,
        probes: [...naProbes.slice(0, -1)],
      })
    ).toThrow();
  });

  it("accepts an image-free graph page but not an image-free article", () => {
    const page = encode(
      '<title>Home</title><h1>Home</h1><meta name="description" content="Summary"><link rel="canonical" href="/">'
    );
    expect(semanticSnapshot("graph-page", page)).toBeDefined();
    expect(() => semanticSnapshot("visible-article", page)).toThrow(
      "lacks images"
    );
  });

  it("requires noindex for an archived article", () => {
    const article = encode(
      '<title>Archived</title><h1>Archived</h1><meta name="description" content="Summary"><link rel="canonical" href="/articles/archived"><img src="/image.webp" alt="Hero">'
    );
    expect(() => semanticSnapshot("archived-article", article)).toThrow(
      "noindex"
    );
  });
  it("reports parity mismatches without deploying", async () => {
    const spec = validateParitySpec({ schemaVersion: 1, probes });
    globalThis.fetch = Object.assign(
      (input: Parameters<typeof fetch>[0]) => {
        const url = new URL(String(input));
        const isCandidate = url.hostname === "candidate.example";
        if (url.pathname.endsWith(".webp")) {
          return Promise.resolve(new Response(encode("image")));
        }
        if (url.pathname.endsWith(".json")) {
          return Promise.resolve(
            Response.json({
              items: [
                {
                  id: "https://site.example/articles/visible",
                  title: "Article",
                },
              ],
            })
          );
        }
        if (url.pathname.endsWith("feed.xml")) {
          return Promise.resolve(
            new Response(
              "<rss><title>Feed</title><item><title>Article</title><link>https://site.example/articles/visible</link></item></rss>"
            )
          );
        }
        if (url.pathname.endsWith("sitemap.xml")) {
          return Promise.resolve(
            new Response(
              "<urlset><loc>https://site.example/articles</loc></urlset>"
            )
          );
        }
        return Promise.resolve(
          new Response(
            `<title>Article</title><h1>${isCandidate ? "Changed" : "Original"}</h1><meta name="description" content="Summary"><meta name="robots" content="noindex"><link rel="canonical" href="/articles/visible"><img src="/image.webp" alt="Hero">`
          )
        );
      },
      { preconnect: originalFetch.preconnect }
    );
    const result = await compareDeployments(
      spec,
      new URL("https://baseline.example"),
      new URL("https://candidate.example")
    );
    expect(
      result.mismatches.some((mismatch) => mismatch.includes("visible-article"))
    ).toBe(true);
  });
});
