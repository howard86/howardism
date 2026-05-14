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
  type?: string;
  updated?: string;
}

export interface ParsedWikiFile {
  body: string;
  frontmatter: WikiFrontmatter;
  mtime: Date;
  source: WikiSource;
}

const WIKI_LINK_RE = /\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]/;
const STRIP_WIKILINK_RE = /\[\[([^\]|\\]+)(?:\\?\|([^\]]+))?\]\]/g;
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
