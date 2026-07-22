import { describe, expect, it } from "bun:test";
import { getVisibleArticles } from "@/app/(blog)/articles/service";
import { GET } from "@/app/llms.txt/route";
import { env } from "@/config/env";

// Mirrors Lighthouse's agentic `llms-txt` audit
// (core/audits/agentic/llms-txt.js): a malformed file scores 0, so these
// checks match its hard requirements verbatim.
const H1_PATTERN = /^\s*#\s+.+/m;
const LINK_PATTERN = /\[.+\]\(.+\)/;
const MIN_LENGTH = 50;

describe("llms.txt route", () => {
  it("returns a 2xx response with markdown content", async () => {
    const response = await GET();
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);

    const body = await response.text();
    expect(body.length).toBeGreaterThan(0);
  });

  it("contains an H1 heading", async () => {
    const body = await (await GET()).text();
    expect(H1_PATTERN.test(body)).toBe(true);
  });

  it("contains at least one markdown link", async () => {
    const body = await (await GET()).text();
    expect(LINK_PATTERN.test(body)).toBe(true);
  });

  it("is at least 50 characters", async () => {
    const body = await (await GET()).text();
    expect(body.length).toBeGreaterThanOrEqual(MIN_LENGTH);
  });

  it("lists every visible article as a markdown link", async () => {
    const body = await (await GET()).text();
    const visible = await getVisibleArticles();

    expect(visible.ids.length).toBeGreaterThan(0);
    for (const slug of visible.ids) {
      expect(body).toContain(
        `(${env.NEXT_PUBLIC_DOMAIN_NAME}/articles/${slug})`
      );
    }
  });
});
