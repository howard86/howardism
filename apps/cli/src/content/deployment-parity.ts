/** biome-ignore-all lint/performance/noAwaitInLoops: Network probes are deliberately serialized to bound deployed-site load. */
import { createHash } from "node:crypto";
import { parseArgs } from "node:util";
import { file } from "bun";
import { z } from "zod";

const ESCAPED_SLASH = /%5c|%2f/i;

function safeProbePath(path: string): boolean {
  return !(
    path.startsWith("//") ||
    path.includes("\\") ||
    ESCAPED_SLASH.test(path) ||
    path.split("/").includes("..")
  );
}

const ProbeKind = z.enum([
  "visible-article",
  "archived-article",
  "on-demand-article",
  "translated-article",
  "graph-page",
  "search-shell",
  "rss-json",
  "rss-xml",
  "sitemap",
  "image",
]);
const ProbeSchema = z.strictObject({
  kind: ProbeKind,
  path: z.string().startsWith("/").refine(safeProbePath),
  status: z.number().int().min(200).max(599).default(200),
});
const NotApplicableSchema = z.strictObject({
  kind: z.enum(["archived-article", "on-demand-article"]),
  notApplicable: z.strictObject({
    reason: z.string().trim().min(10),
    baselineEvidence: z.string().trim().min(10),
  }),
});
export const ParitySpecSchema = z.strictObject({
  schemaVersion: z.literal(1),
  probes: z.array(z.union([ProbeSchema, NotApplicableSchema])).min(10),
});
export type ParitySpec = z.infer<typeof ParitySpecSchema>;
const REQUIRED_KINDS = ProbeKind.options;
const MAX_BYTES = 8 * 1024 * 1024;
const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const HEADINGS = /<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
const SEARCH_TEXT = /search|搜尋/i;

export function validateParitySpec(input: unknown): ParitySpec {
  const spec = ParitySpecSchema.parse(input);
  const kinds = new Set(spec.probes.map((probe) => probe.kind));
  for (const kind of REQUIRED_KINDS) {
    if (!kinds.has(kind)) {
      throw new Error(`Missing mandatory parity probe: ${kind}`);
    }
  }
  const paths = new Set<string>();
  for (const probe of spec.probes) {
    const key =
      "path" in probe
        ? `${probe.kind}:${probe.path}`
        : `${probe.kind}:not-applicable`;
    if (paths.has(key)) {
      throw new Error(`Duplicate parity probe: ${key}`);
    }
    paths.add(key);
  }
  return spec;
}

function decode(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
function textContent(value: string): string {
  return decode(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}
function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`(?:^|\\s)${name}=["']([^"']*)["']`, "i"));
  return match ? decode(match[1]) : undefined;
}
function normalizeLink(
  value: string | undefined,
  deploymentOrigin?: URL
): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value, deploymentOrigin ?? "https://parity.invalid");
    const path = `${url.pathname}${url.search}`;
    if (
      (value.startsWith("/") && !value.startsWith("//")) ||
      url.origin === deploymentOrigin?.origin
    ) {
      return `deployment:${path}`;
    }
    return `${url.origin}${path}`;
  } catch {
    return value;
  }
}
function tags(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(
    (match) => match[0]
  );
}
function htmlSemantics(html: string, kind: string, deploymentOrigin?: URL) {
  const metas = tags(html, "meta");
  const links = tags(html, "link");
  const meta = (name: string) =>
    metas.find(
      (tag) => attr(tag, "name") === name || attr(tag, "property") === name
    );
  const title = html.match(TITLE);
  const headings = [...html.matchAll(HEADINGS)].map(
    (match) => `${match[1]}:${textContent(match[2])}`
  );
  const images = tags(html, "img").map((tag) => ({
    src: normalizeLink(attr(tag, "src"), deploymentOrigin),
    alt: attr(tag, "alt") ?? "",
  }));
  const articleLinks = tags(html, "a")
    .map((tag) => normalizeLink(attr(tag, "href"), deploymentOrigin))
    .filter((href): href is string => Boolean(href?.includes("/articles/")))
    .sort();
  const pageTitle = title ? textContent(title[1]) : undefined;
  const description = attr(meta("description") ?? "", "content");
  const canonical = normalizeLink(
    attr(links.find((tag) => attr(tag, "rel") === "canonical") ?? "", "href"),
    deploymentOrigin
  );
  if (!pageTitle || headings.length === 0) {
    throw new Error(`HTML parity probe lacks title or headings: ${kind}`);
  }
  if (kind !== "search-shell" && !(description && canonical)) {
    throw new Error(`HTML parity probe lacks metadata: ${kind}`);
  }
  // The home page (graph-page) has no <img>; only article pages carry hero art.
  if (kind.endsWith("-article") && images.length === 0) {
    throw new Error(`Article parity probe lacks images: ${kind}`);
  }
  const robots = attr(meta("robots") ?? "", "content");
  if (kind === "archived-article" && !robots?.includes("noindex")) {
    throw new Error("Archived article lacks noindex metadata");
  }
  return {
    title: pageTitle,
    description,
    canonical,
    robots,
    headings,
    images,
    translations: links
      .filter((tag) => attr(tag, "hreflang"))
      .map(
        (tag) =>
          `${attr(tag, "hreflang")}:${normalizeLink(attr(tag, "href"), deploymentOrigin)}`
      )
      .sort(),
    ...(kind === "graph-page" ? { articleLinks } : {}),
    ...(kind === "search-shell"
      ? { searchTextPresent: SEARCH_TEXT.test(textContent(html)) }
      : {}),
  };
}
function xmlValues(xml: string, tag: string): string[] {
  return [
    ...xml.matchAll(
      new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi")
    ),
  ].map((match) => textContent(match[1]));
}
export function semanticSnapshot(
  kind: z.infer<typeof ProbeKind>,
  body: Uint8Array,
  deploymentOrigin?: URL
): unknown {
  const value = new TextDecoder().decode(body);
  if (kind === "image") {
    return createHash("sha256").update(body).digest("hex");
  }
  if (kind === "rss-json") {
    const feed = JSON.parse(value) as {
      items?: { id?: string; title?: string; url?: string }[];
    };
    if (!Array.isArray(feed.items) || feed.items.length === 0) {
      throw new Error("JSON feed has no items");
    }
    return feed.items
      .map((item) => [
        normalizeLink(item.id, deploymentOrigin),
        item.title,
        normalizeLink(item.url, deploymentOrigin),
      ])
      .sort();
  }
  if (kind === "rss-xml") {
    const titles = xmlValues(value, "title");
    const links = xmlValues(value, "link").map((link) =>
      normalizeLink(link, deploymentOrigin)
    );
    if (titles.length < 2 || links.length < 1) {
      throw new Error("RSS feed lacks items");
    }
    return { titles, links };
  }
  if (kind === "sitemap") {
    const locations = xmlValues(value, "loc")
      .map((link) => normalizeLink(link, deploymentOrigin))
      .sort();
    if (locations.length < 1) {
      throw new Error("Sitemap lacks locations");
    }
    return locations;
  }
  return htmlSemantics(value, kind, deploymentOrigin);
}

async function fetchProbe(
  origin: URL,
  path: string
): Promise<{ status: number; body: Uint8Array }> {
  const destination = new URL(path, origin);
  if (destination.origin !== origin.origin) {
    throw new Error("Parity probe escaped the requested origin");
  }
  const response = await fetch(destination, {
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) {
    throw new Error(`Parity response too large: ${path}`);
  }
  if (!response.body) {
    throw new Error(`Parity response has no body: ${path}`);
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    let next = await reader.read();
    while (!next.done) {
      total += next.value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new Error(`Parity response too large: ${path}`);
      }
      chunks.push(next.value);
      next = await reader.read();
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { status: response.status, body };
}
export async function compareDeployments(
  spec: ParitySpec,
  baseline: URL,
  candidate: URL
) {
  const mismatches: string[] = [];
  const notExecuted: {
    kind: string;
    reason: string;
    baselineEvidence: string;
  }[] = [];
  let checked = 0;
  for (const probe of spec.probes) {
    if ("notApplicable" in probe) {
      notExecuted.push({ kind: probe.kind, ...probe.notApplicable });
      continue;
    }
    checked += 1;
    const [before, after] = await Promise.all([
      fetchProbe(baseline, probe.path),
      fetchProbe(candidate, probe.path),
    ]);
    if (before.status !== probe.status || after.status !== probe.status) {
      mismatches.push(
        `${probe.kind} ${probe.path}: status baseline=${before.status} candidate=${after.status}`
      );
      continue;
    }
    const beforeValue = semanticSnapshot(probe.kind, before.body, baseline);
    const afterValue = semanticSnapshot(probe.kind, after.body, candidate);
    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      mismatches.push(`${probe.kind} ${probe.path}: semantic output differs`);
    }
  }
  return {
    checked,
    notExecuted,
    mismatches,
    onDemandClassification:
      "pending build evidence that the chosen route was not prerendered",
    searchInteraction: "requires browser acceptance",
    runtimeR2Independence: "requires network-disabled runtime acceptance",
  };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      baseline: { type: "string" },
      candidate: { type: "string" },
      spec: { type: "string" },
    },
  });
  if (!(values.baseline && values.candidate && values.spec)) {
    throw new Error("Require --baseline --candidate --spec");
  }
  const baseline = new URL(values.baseline);
  const candidate = new URL(values.candidate);
  if (
    baseline.protocol !== "https:" ||
    candidate.protocol !== "https:" ||
    baseline.origin === candidate.origin ||
    baseline.username ||
    candidate.username ||
    baseline.password ||
    candidate.password ||
    baseline.pathname !== "/" ||
    candidate.pathname !== "/" ||
    baseline.search ||
    candidate.search
  ) {
    throw new Error("Require distinct bare HTTPS parity origins");
  }
  const spec = validateParitySpec(await file(values.spec).json());
  const result = await compareDeployments(spec, baseline, candidate);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.mismatches.length) {
    process.exitCode = 1;
  }
}
if (import.meta.main) {
  await main();
}
