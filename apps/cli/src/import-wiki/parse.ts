import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";

import matter from "gray-matter";

export type WikiFolder = "concepts" | "derived";

export interface WikiSource {
  absolutePath: string;
  folder: WikiFolder;
  slug: string;
}

export interface WikiFrontmatter {
  /**
   * Author-set flag to hide a wiki entry from the public blog. Articles with
   * `archived: true` are dropped from the link graph and (eventually) the
   * MDX emission pipeline.
   */
  archived?: boolean;
  created?: string;
  generated?: string;
  question?: string;
  sources?: string[];
  tags?: string[];
  title?: string;
  /**
   * Optional editorial topic for the article. Authors may set this directly
   * in Obsidian frontmatter; if absent, the importer falls back to the
   * `wiki-topic-overrides.json` sidecar.
   */
  topic?: string;
  type?: string;
  updated?: string;
}

export interface ParsedWikiFile {
  body: string;
  frontmatter: WikiFrontmatter;
  mtime: Date;
  source: WikiSource;
}

/**
 * Resolved metadata for a `raw/<slug>.md` source document. Drives both the
 * per-article `## Sources` audit block and the upgrade of inline
 * `[[raw/...]]` references to clickable links.
 */
export interface RawDoc {
  /** Original raw filename slug (without `.md`). Used as a stable key. */
  slug: string;
  /** Author-set title from the raw doc's frontmatter; fall back to humanised slug. */
  title: string;
  /** Public URL from the raw doc's `source:` frontmatter, when set. */
  url?: string;
}

const WIKI_LINK_RE = /\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]/;
const STRIP_WIKILINK_RE = /\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]/g;
const RAW_REF_RE = /\[\[raw\/([^\]|\\]+)(?:\\?\|[^\]]+)?\]\]/g;
const HTTP_URL_RE = /^https?:\/\//i;
const TABLE_ROW_RE = /^\s*\|\s*\[\[[^\]]+\]\][^|]*\|[^|]+\|/;
const HEADING_RE = /^##\s+(.+)$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const HUMANIZE_RAW_RE = /[._-]+/g;
const WHITESPACE_RE = /\s+/g;

export async function discoverWikiSources(
  wikiRoot: string
): Promise<WikiSource[]> {
  const folders: WikiFolder[] = ["concepts", "derived"];
  const results: WikiSource[] = [];

  for (const folder of folders) {
    const dir = join(wikiRoot, folder);
    const entries = await readdir(dir);
    for (const entry of entries) {
      if (extname(entry) !== ".md") {
        continue;
      }
      const slug = basename(entry, ".md");
      if (slug.startsWith(".")) {
        continue;
      }
      results.push({
        slug,
        folder,
        absolutePath: join(dir, entry),
      });
    }
  }

  results.sort((a, b) => a.slug.localeCompare(b.slug));
  return results;
}

export async function parseWikiFile(
  source: WikiSource
): Promise<ParsedWikiFile> {
  const raw = await readFile(source.absolutePath, "utf8");
  const { data, content } = matter(raw);
  const { mtime } = await stat(source.absolutePath);

  return {
    source,
    frontmatter: normaliseFrontmatter(data),
    body: content,
    mtime,
  };
}

function normaliseFrontmatter(data: Record<string, unknown>): WikiFrontmatter {
  const result: Record<string, unknown> = { ...data };
  for (const key of ["created", "updated", "generated"] as const) {
    const value = result[key];
    if (value instanceof Date) {
      result[key] = value.toISOString().slice(0, 10);
    }
  }
  return result as WikiFrontmatter;
}

/**
 * Parse index.md's Concepts and Derived tables, keyed by bare slug.
 *
 * Why: meta.description for each article comes from the human-authored
 * one-liner in this catalog. Skips Source Documents (raw inputs, not articles).
 */
export async function parseIndexSummaries(
  indexPath: string
): Promise<Map<string, string>> {
  const raw = await readFile(indexPath, "utf8");
  const { content } = matter(raw);
  const lines = content.split("\n");
  const summaries = new Map<string, string>();

  let currentSection: string | null = null;
  for (const line of lines) {
    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      currentSection = headingMatch[1].trim().toLowerCase();
      continue;
    }

    if (currentSection !== "concepts" && currentSection !== "derived") {
      continue;
    }
    if (!TABLE_ROW_RE.test(line)) {
      continue;
    }

    const cells = line
      .trim()
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    const [pageCell, summaryCell] = cells;
    if (!(pageCell && summaryCell)) {
      continue;
    }

    const linkMatch = WIKI_LINK_RE.exec(pageCell);
    if (!linkMatch) {
      continue;
    }

    const target = linkMatch[1];
    const slug = target.split("/").pop();
    if (!slug) {
      continue;
    }

    summaries.set(slug, stripWikilinksToText(summaryCell));
  }

  return summaries;
}

/**
 * Pull the bare raw slugs out of a wiki article's `sources:` frontmatter
 * list. Entries are wikilinks; only the `[[raw/<slug>]]` form is kept — the
 * `[[wiki/<folder>/<slug>]]` form refers to other in-vault concepts and is
 * already surfaced via the backlinks graph.
 *
 * Returns slugs in author-written order, deduplicated. Used by the importer
 * to drive raw-doc resolution.
 */
export function extractRawSlugsFromSources(
  sources: string[] | undefined
): string[] {
  if (!sources) {
    return [];
  }
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const entry of sources) {
    for (const match of entry.matchAll(RAW_REF_RE)) {
      // Keep the full path after `raw/` — Obsidian allows subdirectories
      // (e.g. `raw/Claude Mythos Preview / red.anthropic.com`), and the
      // path-segments map straight onto the on-disk layout under `raw/`.
      const fullPath = match[1];
      if (!fullPath || seen.has(fullPath)) {
        continue;
      }
      seen.add(fullPath);
      slugs.push(fullPath);
    }
  }
  return slugs;
}

/**
 * Pull every raw slug referenced inline in an article body. Mirrors the
 * resolution rules in `rewriteWikilinks` but only returns `raw/...` targets
 * — internal slugs go through `extractInternalSlugs`. Duplicates are
 * preserved so callers can keep their own per-target state if needed.
 */
export function extractRawSlugsFromBody(body: string): string[] {
  const slugs: string[] = [];
  for (const match of body.matchAll(RAW_REF_RE)) {
    const fullPath = match[1];
    if (fullPath) {
      slugs.push(fullPath);
    }
  }
  return slugs;
}

/**
 * Read and parse a single `raw/<slug>.md` document. Returns `null` when the
 * file is missing — callers warn and fall back to the humanised slug rather
 * than fail the whole import.
 *
 * URL is taken from the raw doc's `source:` frontmatter; we trust the
 * vault here (raw docs are author-curated clippings) and only normalise
 * empty / non-http(s) values to `undefined` so the rendered output never
 * produces a broken or relative link.
 */
export async function loadRawDoc(
  rawRoot: string,
  slug: string
): Promise<RawDoc | null> {
  const absolutePath = join(rawRoot, `${slug}.md`);
  let raw: string;
  try {
    raw = await readFile(absolutePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }

  const { data } = matter(raw);
  const rawData = data as { source?: unknown; title?: unknown };
  const title =
    typeof rawData.title === "string" && rawData.title.trim().length > 0
      ? rawData.title.trim()
      : humanizeRawSlug(slug);
  const candidateUrl =
    typeof rawData.source === "string" ? rawData.source.trim() : "";
  const url =
    candidateUrl.length > 0 && HTTP_URL_RE.test(candidateUrl)
      ? candidateUrl
      : undefined;

  return { slug, title, url };
}

function humanizeRawSlug(slug: string): string {
  return slug.replace(HUMANIZE_RAW_RE, " ").replace(WHITESPACE_RE, " ").trim();
}

export function stripWikilinksToText(input: string): string {
  return input.replace(STRIP_WIKILINK_RE, (_match, target, label) => {
    if (label) {
      return String(label).trim();
    }
    const path = String(target);
    const slug = path.split("/").pop() ?? path;
    if (path.startsWith("raw/")) {
      return slug
        .replace(HUMANIZE_RAW_RE, " ")
        .replace(WHITESPACE_RE, " ")
        .trim();
    }
    return titleFromSlug(slug);
  });
}

export function buildSlugTitleMap(
  parsed: ParsedWikiFile[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const file of parsed) {
    const title =
      file.frontmatter.title?.trim() ?? titleFromSlug(file.source.slug);
    map.set(file.source.slug, title);
  }
  return map;
}

export function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/**
 * Resolve the article's publish date:
 *   concepts → created → updated → mtime
 *   derived  → generated → updated → mtime
 * Always `YYYY-MM-DD`.
 */
export function resolveDate(file: ParsedWikiFile): string {
  const { frontmatter, source, mtime } = file;
  const primary =
    source.folder === "concepts" ? frontmatter.created : frontmatter.generated;
  const candidate = primary ?? frontmatter.updated;
  if (candidate) {
    return normaliseDate(candidate);
  }
  return mtime.toISOString().slice(0, 10);
}

function normaliseDate(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  const trimmed = String(value).trim();
  if (ISO_DATE_RE.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Unparseable date value: ${trimmed}`);
  }
  return parsed.toISOString().slice(0, 10);
}
