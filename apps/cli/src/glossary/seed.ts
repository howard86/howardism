import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import matter from "gray-matter";

import type { GlossaryEntry } from "./store.ts";

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

interface ArticleFrontmatter {
  tag?: string;
  title?: string;
}

interface WikiSourceEntry {
  author?: string;
}

interface WikiSourcesFile {
  sources?: WikiSourceEntry[];
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

/**
 * Harvest the seed glossary from in-repo signals: Entity-tagged article
 * titles+slugs, wiki-sources authors, and a hand-curated tech acronym list.
 * Returns the deduped (case-insensitive by `term`) entries without persisting.
 */
export async function harvestSeedEntries(
  sources: SeedSources
): Promise<GlossaryEntry[]> {
  const [entityTerms, authorTerms] = await Promise.all([
    collectEntityTermsFromArticles(sources.articlesDir),
    collectAuthorTermsFromWikiSources(sources.wikiSourcesPath),
  ]);
  const techTerms = collectBaseTechTerms();
  return dedupeByTerm([...entityTerms, ...authorTerms, ...techTerms]);
}
