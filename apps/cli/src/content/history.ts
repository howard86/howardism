/** biome-ignore-all lint/performance/noAwaitInLoops: Reads are deliberately sequential so memory stays bounded and replay order is deterministic. */
import { createHash } from "node:crypto";
import { mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  type CorpusState,
  EMPTY_RELEASE_HISTORY,
  type NoteHistory,
  type ReleaseEntry,
  type ReleaseHistoryManifest,
  ReleaseHistoryManifestSchema,
} from "@howardism/article-contract/manifests/release-history";
import matter from "gray-matter";

const HERO_EXPORT_LINE = /^export \{ default as heroImage \}.*$/gm;
// The importer renders the block as `## Sources`, a blank line, `- ` bullets.
const SOURCES_FIRST = /^## Sources[ \t]*\r?\n(?:[ \t]*\r?\n|- [^\n]*(?:\n|$))*/;
/** `[label](target)` → `label`: rewritten URLs are not revisions. */
const MARKDOWN_LINK = /\[([^\]]*)\]\([^)]*\)/g;
/** `[[slug|label]]` / `[[slug]]`: a wikilink the importer left unresolved. */
const WIKILINK = /\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g;
const WHITESPACE = /\s+/g;
const MDX_SUFFIX = /\.mdx$/;

export const EMPTY_STATE: CorpusState = {
  bodies: {},
  resolved: {},
  sources: {},
};

/** Per-article digest the diff needs: normalized-body hash + source titles. */
export interface ArticleDigest {
  hash: string;
  titles: string[];
}

/** What a corpus looks like at one point in time, reduced to what is diffed. */
export interface Snapshot {
  articles: Record<string, ArticleDigest>;
  /** slug -> resolved question texts */
  resolved: Record<string, string[]>;
}

export const shortHash = (text: string): string =>
  createHash("sha256").update(text).digest("hex").slice(0, 12);

/**
 * Strip what must not count as a revision: frontmatter, the hero export, the
 * importer-generated leading `## Sources` block, link targets and whitespace.
 */
export function normalizeBody(raw: string): string {
  let body = raw.replace(HERO_EXPORT_LINE, "").trimStart();
  if (body.startsWith("## Sources")) {
    body = body.replace(SOURCES_FIRST, "");
  }
  return body
    .replace(WIKILINK, "$1")
    .replace(MARKDOWN_LINK, "$1")
    .replace(WHITESPACE, " ")
    .trim();
}

export function digestArticle(raw: string): ArticleDigest {
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(raw);
  } catch {
    // Unparseable frontmatter (old corpus revisions): hash the whole text.
    return { hash: shortHash(normalizeBody(raw)), titles: [] };
  }
  const sources: unknown = parsed.data.sources;
  const titles = Array.isArray(sources)
    ? sources.flatMap((source: unknown) =>
        source &&
        typeof source === "object" &&
        "title" in source &&
        typeof source.title === "string"
          ? [source.title]
          : []
      )
    : [];
  return { hash: shortHash(normalizeBody(parsed.content)), titles };
}

/** Pull `byConcept[].{slug, resolved[]}` out of open-questions.json, leniently. */
export function resolvedFromOpenQuestions(
  manifest: unknown
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const byConcept =
    manifest && typeof manifest === "object" && "byConcept" in manifest
      ? manifest.byConcept
      : undefined;
  if (!Array.isArray(byConcept)) {
    return out;
  }
  for (const entry of byConcept) {
    if (!(entry && typeof entry === "object" && "slug" in entry)) {
      continue;
    }
    const { slug } = entry;
    const resolved = "resolved" in entry ? entry.resolved : undefined;
    if (typeof slug === "string" && Array.isArray(resolved)) {
      const texts = resolved.filter((t): t is string => typeof t === "string");
      if (texts.length > 0) {
        out[slug] = texts;
      }
    }
  }
  return out;
}

/** Read a CONTENT_ROOT-shaped directory into a snapshot. */
export async function readSnapshot(root: string): Promise<Snapshot> {
  const dir = resolve(root, "content/articles");
  const articles: Record<string, ArticleDigest> = {};
  for (const file of (await readdir(dir)).sort()) {
    if (MDX_SUFFIX.test(file)) {
      articles[file.replace(MDX_SUFFIX, "")] = digestArticle(
        await Bun.file(resolve(dir, file)).text()
      );
    }
  }
  const questions = Bun.file(resolve(root, "data/open-questions.json"));
  return {
    articles,
    resolved: (await questions.exists())
      ? resolvedFromOpenQuestions(await questions.json())
      : {},
  };
}

const byText = (a: string, b: string): number => a.localeCompare(b, "en");

export interface ReleaseDiff {
  new: string[];
  next: CorpusState;
  resolved: ReleaseEntry["resolved"];
  revised: string[];
  sourcesGained: ReleaseEntry["sourcesGained"];
}

/** Pure: diff a snapshot against the previous corpus state. */
export function diffRelease(
  prev: CorpusState,
  snapshot: Snapshot
): ReleaseDiff {
  const slugs = Object.keys(snapshot.articles).sort(byText);
  const next: CorpusState = { bodies: {}, resolved: {}, sources: {} };
  const added: string[] = [];
  const revised: string[] = [];
  const sourcesGained: Record<string, string[]> = {};
  for (const slug of slugs) {
    const { hash, titles } = snapshot.articles[slug];
    next.bodies[slug] = hash;
    const hashed = titles.map(shortHash);
    next.sources[slug] = [...new Set(hashed)].sort(byText);
    const before = prev.bodies[slug];
    if (before === undefined) {
      added.push(slug);
    } else if (before === hash) {
      continue;
    } else {
      revised.push(slug);
    }
    const known = new Set(prev.sources[slug] ?? []);
    const gained = [...new Set(titles)]
      .filter((title) => !known.has(shortHash(title)))
      .sort(byText);
    if (gained.length > 0) {
      sourcesGained[slug] = gained;
    }
  }
  const resolved: ReleaseEntry["resolved"] = [];
  for (const slug of Object.keys(snapshot.resolved).sort(byText)) {
    const known = new Set(prev.resolved[slug] ?? []);
    const hashes = new Set<string>();
    for (const text of snapshot.resolved[slug]) {
      const hash = shortHash(text);
      hashes.add(hash);
      if (!known.has(hash)) {
        resolved.push({ slug, text });
      }
    }
    next.resolved[slug] = [...hashes].sort(byText);
  }
  return { next, new: added, resolved, revised, sourcesGained };
}

/** Derive per-note activity from the release list, dropping deleted slugs. */
export function deriveNotes(
  releases: readonly ReleaseEntry[],
  head: CorpusState
): Record<string, NoteHistory> {
  const notes: Record<string, NoteHistory> = {};
  for (const release of releases) {
    for (const slug of release.new) {
      notes[slug] ??= { first: release.date, revisions: [] };
    }
    for (const slug of release.revised) {
      notes[slug] ??= { first: release.date, revisions: [] };
      const note = notes[slug];
      if (
        note.first !== release.date &&
        !note.revisions.includes(release.date)
      ) {
        note.revisions.push(release.date);
      }
    }
  }
  const out: Record<string, NoteHistory> = {};
  for (const slug of Object.keys(notes).sort(byText)) {
    if (!(slug in head.bodies)) {
      continue;
    }
    const { first, revisions } = notes[slug];
    out[slug] = {
      first,
      ...(revisions.length > 0 ? { revised: revisions.at(-1) } : {}),
      revisions,
    };
  }
  return out;
}

export interface RecordResult {
  changed: boolean;
  history: ReleaseHistoryManifest;
  release?: ReleaseEntry;
}

/** Record one release; re-records the latest when it has the same date. */
export function recordRelease(
  history: ReleaseHistoryManifest,
  snapshot: Snapshot,
  date: string
): RecordResult {
  const last = history.releases.at(-1);
  const rerecord = last?.date === date;
  const baseline = rerecord ? (history.base ?? EMPTY_STATE) : history.head;
  const diff = diffRelease(baseline, snapshot);
  if (
    diff.new.length === 0 &&
    diff.revised.length === 0 &&
    diff.resolved.length === 0
  ) {
    return { changed: false, history };
  }
  const release: ReleaseEntry = {
    date,
    new: diff.new,
    no: rerecord && last ? last.no : (last?.no ?? 0) + 1,
    resolved: diff.resolved,
    revised: diff.revised,
    sourcesGained: diff.sourcesGained,
  };
  const releases = rerecord
    ? [...history.releases.slice(0, -1), release]
    : [...history.releases, release];
  const next = ReleaseHistoryManifestSchema.parse({
    base: rerecord ? history.base : history.head,
    head: diff.next,
    notes: deriveNotes(releases, diff.next),
    releases,
    schemaVersion: 1,
  });
  return { changed: true, history: next, release };
}

export async function readHistory(
  path: string
): Promise<ReleaseHistoryManifest> {
  const file = Bun.file(path);
  return (await file.exists())
    ? ReleaseHistoryManifestSchema.parse(await file.json())
    : EMPTY_RELEASE_HISTORY;
}

export async function writeHistory(
  path: string,
  history: ReleaseHistoryManifest
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await Bun.write(path, `${JSON.stringify(history, null, 2)}\n`);
}

export const todayUtc = (): string => new Date().toISOString().slice(0, 10);

export interface SummaryRow {
  date: string;
  new: number;
  no: number;
  resolved: number;
  revised: number;
}

export const summarize = (release: ReleaseEntry): SummaryRow => ({
  no: release.no,
  date: release.date,
  new: release.new.length,
  revised: release.revised.length,
  resolved: release.resolved.length,
});
