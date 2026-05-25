import {
  mkdir,
  open,
  readdir,
  readFile,
  rename,
  unlink,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import matter from "gray-matter";

const HERE = dirname(new URL(import.meta.url).pathname);
const CLI_ROOT = resolve(HERE, "../../");
const REPO_ROOT = resolve(CLI_ROOT, "../../");

export const DEFAULT_GLOSSARY_PATH = resolve(
  CLI_ROOT,
  ".translate-glossary.json"
);
export const DEFAULT_ARTICLES_DIR = resolve(
  REPO_ROOT,
  "apps/blog/src/content/articles"
);
export const DEFAULT_WIKI_SOURCES_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/wiki-sources.json"
);

export const GLOSSARY_CATEGORIES = [
  "person",
  "org",
  "product",
  "tech",
  "entity",
] as const;

export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

export interface GlossaryEntry {
  category: string;
  term: string;
}

export interface Glossary {
  terms: GlossaryEntry[];
}

export interface SeedSources {
  articlesDir: string;
  wikiSourcesPath: string;
}

/**
 * Hand-curated tech acronyms / loanwords that should never be translated. The
 * importer's body content frequently mixes these into prose; keeping them
 * verbatim in the zh-TW copy preserves their referential weight.
 */
export const BASE_TECH_TERMS: readonly string[] = [
  "MCP",
  "RLHF",
  "RAG",
  "ACP",
  "LLM",
  "SDK",
  "API",
  "CLI",
  "AI",
  "AGI",
  "eval",
  "evals",
];

const MDX_SUFFIX_RE = /\.mdx$/;

interface WikiSourceEntry {
  author?: string;
}

interface WikiSourcesFile {
  sources?: WikiSourceEntry[];
}

const isGlossaryEntry = (value: unknown): value is GlossaryEntry => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as Record<string, unknown>;
  return typeof v.term === "string" && typeof v.category === "string";
};

const parseGlossary = (raw: string): Glossary => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    // Tolerate a corrupt/empty DB (e.g. a torn write): callers re-seed rather
    // than crash every `list`/`add` subprocess.
    return { terms: [] };
  }
  if (!parsed || typeof parsed !== "object") {
    return { terms: [] };
  }
  const obj = parsed as { terms?: unknown };
  if (!Array.isArray(obj.terms)) {
    return { terms: [] };
  }
  return { terms: obj.terms.filter(isGlossaryEntry) };
};

const serializeGlossary = (glossary: Glossary): string =>
  `${JSON.stringify(glossary, null, 2)}\n`;

/**
 * Atomic write: emit JSON to a sibling temp file in the same directory, then
 * `rename` over the destination. Same-directory rename is atomic on POSIX, so
 * a concurrent reader either sees the old or the new content — never a torn
 * write.
 */
const atomicWriteJson = async (
  path: string,
  glossary: Glossary
): Promise<void> => {
  await mkdir(dirname(path), { recursive: true });
  const tmpPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  await Bun.write(tmpPath, serializeGlossary(glossary));
  await rename(tmpPath, path);
};

const sleep = (ms: number): Promise<void> =>
  new Promise((res) => {
    setTimeout(res, ms);
  });

const LOCK_RETRY_MAX = 100;
const LOCK_RETRY_BASE_MS = 10;
const LOCK_RETRY_JITTER_MS = 25;
const LOCK_STALE_MS = 30_000;

/**
 * Cross-process lock for read-modify-write of the glossary DB. Multiple engine
 * subprocesses may race on `add`; this serialises them via an `O_EXCL`
 * lockfile and treats files older than `LOCK_STALE_MS` as stale (a previous
 * holder crashed). The lockfile lives next to the DB so it's gitignored
 * alongside it.
 */
const withLock = async <T>(path: string, fn: () => Promise<T>): Promise<T> => {
  const lockPath = `${path}.lock`;
  await mkdir(dirname(lockPath), { recursive: true });
  let acquired = false;
  for (let attempt = 0; attempt < LOCK_RETRY_MAX; attempt += 1) {
    try {
      const fh = await open(lockPath, "wx");
      await fh.close();
      acquired = true;
      break;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") {
        throw err;
      }
      // Stale-lock detection: if the file is older than LOCK_STALE_MS, drop
      // it. Tolerate ENOENT (someone else released it first).
      try {
        const lockFile = Bun.file(lockPath);
        const lastModified = lockFile.lastModified;
        if (lastModified > 0 && Date.now() - lastModified > LOCK_STALE_MS) {
          await unlink(lockPath).catch(() => undefined);
        }
      } catch {
        // ignore stale-check failures; we'll just retry
      }
      await sleep(
        LOCK_RETRY_BASE_MS + Math.floor(Math.random() * LOCK_RETRY_JITTER_MS)
      );
    }
  }
  if (!acquired) {
    throw new Error(
      `Failed to acquire glossary lock at ${lockPath} after ${LOCK_RETRY_MAX} attempts`
    );
  }
  try {
    return await fn();
  } finally {
    await unlink(lockPath).catch(() => undefined);
  }
};

const dedupeByTerm = (entries: GlossaryEntry[]): GlossaryEntry[] => {
  const seen = new Set<string>();
  const result: GlossaryEntry[] = [];
  for (const entry of entries) {
    const key = entry.term.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(entry);
  }
  return result;
};

export async function loadGlossary(path: string): Promise<Glossary> {
  try {
    const raw = await readFile(path, "utf8");
    return parseGlossary(raw);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { terms: [] };
    }
    throw err;
  }
}

export async function listTerms(path: string): Promise<GlossaryEntry[]> {
  const glossary = await loadGlossary(path);
  return glossary.terms;
}

export async function addTerm(
  path: string,
  term: string,
  category: string
): Promise<{ added: boolean }> {
  const trimmed = term.trim();
  if (!trimmed) {
    throw new Error("addTerm: term must be a non-empty string");
  }
  if (!category.trim()) {
    throw new Error("addTerm: category must be a non-empty string");
  }
  return await withLock(path, async () => {
    // Re-read inside the lock so we never overwrite a concurrent add that
    // sneaked in between the caller's load and our acquire.
    const current = await loadGlossary(path);
    const key = trimmed.toLowerCase();
    if (current.terms.some((e) => e.term.toLowerCase() === key)) {
      return { added: false };
    }
    const next: Glossary = {
      terms: [...current.terms, { term: trimmed, category: category.trim() }],
    };
    await atomicWriteJson(path, next);
    return { added: true };
  });
}

interface ArticleFrontmatter {
  tag?: string;
  title?: string;
}

const collectEntityTermsFromArticles = async (
  articlesDir: string
): Promise<GlossaryEntry[]> => {
  let entries: string[];
  try {
    entries = await readdir(articlesDir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
  const out: GlossaryEntry[] = [];
  for (const filename of entries) {
    if (!MDX_SUFFIX_RE.test(filename)) {
      continue;
    }
    const slug = filename.replace(MDX_SUFFIX_RE, "");
    const filePath = join(articlesDir, filename);
    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch {
      continue;
    }
    const { data } = matter(raw);
    const fm = data as ArticleFrontmatter;
    if (fm.tag !== "Entity") {
      continue;
    }
    if (typeof fm.title === "string" && fm.title.trim()) {
      out.push({ term: fm.title.trim(), category: "entity" });
    }
    out.push({ term: slug, category: "entity" });
  }
  return out;
};

const collectAuthorTermsFromWikiSources = async (
  wikiSourcesPath: string
): Promise<GlossaryEntry[]> => {
  let raw: string;
  try {
    raw = await readFile(wikiSourcesPath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
  let parsed: WikiSourcesFile;
  try {
    parsed = JSON.parse(raw) as WikiSourcesFile;
  } catch {
    return [];
  }
  const sources = parsed.sources ?? [];
  const out: GlossaryEntry[] = [];
  for (const source of sources) {
    if (typeof source.author === "string" && source.author.trim()) {
      out.push({ term: source.author.trim(), category: "person" });
    }
  }
  return out;
};

const collectBaseTechTerms = (): GlossaryEntry[] =>
  BASE_TECH_TERMS.map((term) => ({ term, category: "tech" }));

/**
 * Build the seed glossary from in-repo signals: Entity-tagged article
 * titles+slugs, wiki-sources authors, and a hand-curated tech acronym list.
 * Returns the deduped (case-insensitive by `term`) result without writing.
 */
export async function seed(sources: SeedSources): Promise<Glossary> {
  const [entityTerms, authorTerms] = await Promise.all([
    collectEntityTermsFromArticles(sources.articlesDir),
    collectAuthorTermsFromWikiSources(sources.wikiSourcesPath),
  ]);
  const techTerms = collectBaseTechTerms();
  const all = [...entityTerms, ...authorTerms, ...techTerms];
  return { terms: dedupeByTerm(all) };
}

/**
 * True when the DB at `path` is absent, empty, or unparseable — i.e. it should
 * be (re)seeded. A populated, valid DB returns false so manually/agent-added
 * terms persist across reruns.
 */
const isSeedable = async (path: string): Promise<boolean> => {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return true;
    }
    throw err;
  }
  if (raw.trim() === "") {
    return true;
  }
  try {
    JSON.parse(raw);
  } catch {
    return true;
  }
  return false;
};

/**
 * Idempotent seed: writes the seed glossary to `path` only when it is missing,
 * empty, or corrupt. A valid existing DB is left untouched so added terms
 * persist across reruns.
 */
export async function seedIfMissing(
  path: string,
  sources: SeedSources
): Promise<void> {
  if (!(await isSeedable(path))) {
    return;
  }
  const glossary = await seed(sources);
  await withLock(path, async () => {
    // Double-check inside the lock: another process may have just seeded.
    if (!(await isSeedable(path))) {
      return;
    }
    await atomicWriteJson(path, glossary);
  });
}

interface CliOptions {
  articlesDir: string;
  glossaryPath: string;
  wikiSourcesPath: string;
}

const resolveCliOptions = (): CliOptions => {
  const env = process.env;
  return {
    glossaryPath: resolve(env.GLOSSARY_PATH ?? DEFAULT_GLOSSARY_PATH),
    articlesDir: resolve(env.TRANSLATE_SOURCE_PATH ?? DEFAULT_ARTICLES_DIR),
    wikiSourcesPath: resolve(
      env.WIKI_SOURCES_PATH ?? DEFAULT_WIKI_SOURCES_PATH
    ),
  };
};

const printUsage = (): void => {
  console.log(
    [
      "Usage:",
      "  bun src/translate/glossary.ts list",
      '  bun src/translate/glossary.ts add "<term>" <category>',
      "",
      `Categories: ${GLOSSARY_CATEGORIES.join(" | ")}`,
    ].join("\n")
  );
};

async function runCli(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return command ? 0 : 1;
  }

  const opts = resolveCliOptions();

  if (command === "list") {
    await seedIfMissing(opts.glossaryPath, {
      articlesDir: opts.articlesDir,
      wikiSourcesPath: opts.wikiSourcesPath,
    });
    const terms = await listTerms(opts.glossaryPath);
    console.log(JSON.stringify(terms, null, 2));
    return 0;
  }

  if (command === "add") {
    const [term, category] = rest;
    if (!(term && category)) {
      console.error('add requires: add "<term>" <category>');
      printUsage();
      return 1;
    }
    await seedIfMissing(opts.glossaryPath, {
      articlesDir: opts.articlesDir,
      wikiSourcesPath: opts.wikiSourcesPath,
    });
    const result = await addTerm(opts.glossaryPath, term, category);
    if (result.added) {
      console.log(`added: ${term} (${category})`);
    } else {
      console.log(`exists: ${term}`);
    }
    return 0;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  return 1;
}

if (import.meta.main) {
  runCli(process.argv.slice(2))
    .then((code) => {
      process.exit(code);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
