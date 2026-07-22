"use client";

import { createFuse, searchEntries } from "@howardism/article-contract/search";
import { useEffect } from "react";

import { loadSearchIndex, type SearchEntry } from "./search-data";

/**
 * Minimal ambient shape for the experimental WebMCP imperative API (Chrome
 * 150+, behind `--enable-features=WebMCP`, `[SecureContext]` only). There are
 * no upstream type declarations yet, so this is kept as narrow as the calls
 * below actually need. `navigator.modelContext` is deprecated as of Chrome
 * 150 in favour of `document.modelContext` — only the latter is declared.
 */
interface ModelContextToolDescriptor<TInput> {
  annotations?: { readOnlyHint?: boolean };
  description: string;
  execute: (input: TInput) => Promise<string>;
  inputSchema: Record<string, unknown>;
  name: string;
}

interface ModelContext {
  /**
   * The explainer types this as returning a Promise, but Chrome 150 returns
   * `undefined` synchronously — hence the union and the defensive `register`
   * helper below.
   */
  registerTool<TInput>(
    descriptor: ModelContextToolDescriptor<TInput>,
    options?: { signal?: AbortSignal }
  ): Promise<unknown> | undefined;
}

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

const SEARCH_ARTICLES_TOOL = "search_articles";
const GET_ARTICLE_TOOL = "get_article";

interface SearchArticlesInput {
  limit?: number;
  query: string;
}

interface SearchArticlesResult {
  description: string;
  domain: string | undefined;
  slug: string;
  tag: string;
  title: string;
  url: string;
}

/**
 * Ranks `entries` against `input.query` and shapes the agent-facing payload.
 * Deliberately omits `body` — the article knowledge base can be large, and
 * the full text would flood the calling agent's context; `get_article` fetches
 * it on demand for one slug. Pure and browser-free so it is unit-testable
 * without `document.modelContext`.
 */
export function searchArticles(
  entries: SearchEntry[],
  input: SearchArticlesInput,
  origin: string
): string {
  const fuse = createFuse(entries);
  const results = searchEntries(fuse, input.query, input.limit);
  const payload: SearchArticlesResult[] = results.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    domain: entry.domain,
    tag: entry.tag,
    url: `${origin}/articles/${entry.slug}`,
  }));
  return JSON.stringify(payload);
}

interface GetArticleInput {
  slug: string;
}

/**
 * Returns the full body of the entry matching `input.slug`, already present
 * on every loaded index entry — no network fetch needed. Pure and
 * browser-free so it is unit-testable without `document.modelContext`.
 */
export function getArticle(
  entries: SearchEntry[],
  input: GetArticleInput
): string {
  const entry = entries.find((candidate) => candidate.slug === input.slug);
  if (!entry) {
    return `No article found for slug "${input.slug}".`;
  }
  return entry.body;
}

/**
 * Registers `search_articles` and `get_article` as WebMCP tools so an
 * agentic browser can query the article knowledge base directly, without
 * scraping rendered pages. A complete no-op wherever `document.modelContext`
 * is absent (every browser without the WebMCP flag, and any non-secure
 * context) — renders nothing either way.
 */
export function WebMcpTools() {
  useEffect(() => {
    if (typeof document === "undefined" || !document.modelContext) {
      return;
    }

    const modelContext = document.modelContext;
    const controller = new AbortController();

    /**
     * WebMCP is experimental and its return contract is unstable — Chrome 150
     * returns `undefined` where the explainer promises a Promise, so chaining
     * `.catch` directly throws and takes the whole render down with it. Both
     * shapes are normalised here, and any throw is swallowed: failing to
     * register an optional agent tool must never break the page.
     */
    const register = <TInput,>(
      descriptor: ModelContextToolDescriptor<TInput>
    ) => {
      try {
        Promise.resolve(
          modelContext.registerTool<TInput>(descriptor, {
            signal: controller.signal,
          })
        ).catch(() => {
          // Registration can also lose a race with unmount (the signal aborts
          // before it resolves) — nothing to do but drop the rejection.
        });
      } catch {
        // Synchronous throw from an unstable experimental API.
      }
    };

    register<SearchArticlesInput>({
      name: SEARCH_ARTICLES_TOOL,
      description:
        "Search the howardism.dev article knowledge base by keyword. Returns matching articles' metadata (title, description, domain, tag, url) ranked by relevance — not the full article body.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keywords." },
          limit: {
            type: "number",
            description: "Maximum number of results (default 12).",
          },
        },
        required: ["query"],
      },
      annotations: { readOnlyHint: true },
      // `loadSearchIndex()` pulls a ~200KB+ JSON chunk; it is called only
      // here, inside `execute`, never at registration/mount time.
      execute: async (input) => {
        const entries = await loadSearchIndex();
        return searchArticles(entries, input, window.location.origin);
      },
    });

    register<GetArticleInput>({
      name: GET_ARTICLE_TOOL,
      description:
        "Fetch the full body of one howardism.dev article by slug, as returned by search_articles.",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "The article slug." },
        },
        required: ["slug"],
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const entries = await loadSearchIndex();
        return getArticle(entries, input);
      },
    });

    return () => {
      controller.abort();
    };
  }, []);

  return null;
}
