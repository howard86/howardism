import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  parseSearchIndex,
  type SearchIndexEntry,
} from "@howardism/article-contract/manifests/search-index";
import { createFuse, searchEntries } from "@howardism/article-contract/search";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import matter from "gray-matter";
import { z } from "zod";

import { toPlainText } from "../import-wiki/plain-text.ts";

const HERE = dirname(new URL(import.meta.url).pathname);
const CLI_ROOT = resolve(HERE, "../../");
const REPO_ROOT = resolve(CLI_ROOT, "../../");

/** The blog's committed search index — see apps/cli/src/search-index.ts. */
export const DEFAULT_SEARCH_INDEX_PATH = resolve(
  REPO_ROOT,
  "apps/blog/src/data/search-index.json"
);

/**
 * The MDX `knowledge_get` reads. The index carries no article text — it is
 * metadata plus related keywords — and this server runs against the repo, so
 * full content comes from the article file rather than from a stored excerpt.
 */
const ARTICLES_DIR = resolve(REPO_ROOT, "apps/blog/src/content/articles");

/**
 * MCP tool handlers. Kept as plain (indexPath, args) → CallToolResult
 * functions so they're unit-testable without driving a transport. Each
 * returns a single text block of pretty JSON — the shape MCP clients render
 * to the model. The return type is left inferred so it stays assignable to
 * the SDK's result type (which carries an index signature a named interface
 * could not satisfy).
 */
const jsonResult = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

interface SearchIndexState {
  bySlug: Map<string, SearchIndexEntry>;
  entries: SearchIndexEntry[];
  fuse: ReturnType<typeof createFuse>;
}

// Lazily parsed + Fuse-indexed search index, keyed by resolved path so tests
// exercising different paths don't share state. Parsing + Fuse construction
// only happen on first use of a given path (the index is ~400KB of JSON),
// not at import time.
const indexCache = new Map<string, Promise<SearchIndexState>>();

function loadIndex(indexPath: string): Promise<SearchIndexState> {
  let state = indexCache.get(indexPath);
  if (!state) {
    state = (async () => {
      const raw = await readFile(indexPath, "utf8");
      const { entries } = parseSearchIndex(JSON.parse(raw));
      const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
      return { entries, bySlug, fuse: createFuse(entries) };
    })();
    indexCache.set(indexPath, state);
  }
  return state;
}

/** The fields `knowledge_search` returns — trimmed to keep results small. */
type KnowledgeSearchResult = Omit<SearchIndexEntry, "keywords" | "tags">;

const toSearchResult = (entry: SearchIndexEntry): KnowledgeSearchResult => ({
  slug: entry.slug,
  title: entry.title,
  description: entry.description,
  ...(entry.domain ? { domain: entry.domain } : {}),
  tag: entry.tag,
});

export async function knowledgeSearchHandler(
  indexPath: string,
  args: { limit?: number; query: string }
) {
  const { fuse } = await loadIndex(indexPath);
  const results = searchEntries(fuse, args.query, args.limit).map(
    toSearchResult
  );
  return jsonResult(results);
}

export async function knowledgeGetHandler(
  indexPath: string,
  args: { slug: string }
) {
  const { bySlug } = await loadIndex(indexPath);
  const entry = bySlug.get(args.slug);
  if (!entry) {
    return jsonResult({
      error: `No article found for slug "${args.slug}".`,
    });
  }
  const raw = await readFile(
    resolve(ARTICLES_DIR, `${args.slug}.mdx`),
    "utf8"
  ).catch(() => null);
  if (raw === null) {
    // Indexed but the MDX is gone: report it rather than serving metadata that
    // looks like a successful full-content fetch.
    return jsonResult({
      error: `Article "${args.slug}" is indexed but its MDX is missing.`,
    });
  }
  return jsonResult({ ...entry, body: toPlainText(matter(raw, {}).content) });
}

/** Register the two knowledge-base tools on an MCP server reading `indexPath`. */
export function registerKnowledgeTools(
  server: McpServer,
  indexPath: string
): void {
  server.registerTool(
    "knowledge_search",
    {
      title: "Search Howard's wiki knowledge base",
      description:
        "Search Howard Tai's personal wiki/blog knowledge base (Howardism) — his published articles on AI, software engineering, and other topics. Matches on each article's title, summary, tags, domain and related keywords, using the same fuzzy-match algorithm as the site's own command-palette search. Returns each match's slug, title, description, domain, and tag — NOT the article body (use knowledge_get with the slug to fetch full content). Use this first to find which articles are relevant to a topic.",
      inputSchema: {
        query: z.string().min(1),
        limit: z.number().int().positive().optional(),
      },
    },
    (args) => knowledgeSearchHandler(indexPath, args)
  );

  server.registerTool(
    "knowledge_get",
    {
      title: "Get a full article from Howard's wiki knowledge base",
      description:
        "Fetch one article's full plain-text content, plus its metadata, from Howard Tai's personal wiki/blog knowledge base (Howardism) by slug. Call knowledge_search first to find the right slug. Returns a clear error message (not a thrown error) if the slug doesn't exist.",
      inputSchema: {
        slug: z.string().min(1),
      },
    },
    (args) => knowledgeGetHandler(indexPath, args)
  );
}

const resolveIndexPath = (): string =>
  resolve(process.env.SEARCH_INDEX_PATH ?? DEFAULT_SEARCH_INDEX_PATH);

async function main(): Promise<void> {
  const server = new McpServer({ name: "knowledge", version: "0.1.0" });
  registerKnowledgeTools(server, resolveIndexPath());
  await server.connect(new StdioServerTransport());
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
