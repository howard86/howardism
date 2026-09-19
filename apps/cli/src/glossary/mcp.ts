import type { Database } from "bun:sqlite";
import { resolve } from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  addTerm,
  addTerms,
  DEFAULT_ARTICLES_DIR,
  DEFAULT_GLOSSARY_DB_PATH,
  DEFAULT_WIKI_SOURCES_PATH,
  ensureSeeded,
  GLOSSARY_CATEGORIES,
  listTerms,
  openDb,
  searchTerms,
} from "./store.ts";

/**
 * MCP tool handlers. Kept as plain (db, args) → CallToolResult functions so
 * they're unit-testable without driving a transport. Each returns a single
 * text block of pretty JSON — the shape MCP clients render to the model. The
 * return type is left inferred so it stays assignable to the SDK's result type
 * (which carries an index signature a named interface could not satisfy).
 */
const jsonResult = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const glossaryListHandler = (
  db: Database,
  args: { category?: string }
) => jsonResult(listTerms(db, args.category));

const errorResult = (message: string) => ({
  content: [{ type: "text" as const, text: message }],
  isError: true,
});

export interface GlossaryAddArgs {
  category?: string;
  notes?: string;
  term?: string;
  terms?: { category: string; notes?: string; term: string }[];
}

/**
 * Both shapes of `glossary_add`. A model registering K terms one at a time
 * costs K round-trips through the transport and K fsyncs; `terms` routes the
 * whole list through `addTerms`, which is one transaction. The singular
 * `term`/`category` pair is still accepted so existing callers keep working.
 */
export const glossaryAddHandler = (db: Database, args: GlossaryAddArgs) => {
  if (args.terms) {
    if (args.terms.length === 0) {
      return errorResult("glossary_add: `terms` must not be empty");
    }
    return jsonResult(addTerms(db, args.terms, { source: "agent" }));
  }
  if (!(args.term && args.category)) {
    return errorResult(
      "glossary_add: pass either `terms`, or both `term` and `category`"
    );
  }
  return jsonResult(
    addTerm(db, args.term, args.category, {
      notes: args.notes,
      source: "agent",
    })
  );
};

export const glossarySearchHandler = (db: Database, args: { query: string }) =>
  jsonResult(searchTerms(db, args.query));

/** Register the three glossary tools on an MCP server bound to `db`. */
export function registerGlossaryTools(server: McpServer, db: Database): void {
  server.registerTool(
    "glossary_list",
    {
      title: "List glossary terms",
      description:
        "List the do-not-translate (DNT) glossary terms — proper nouns and technical terms to keep verbatim. Optionally filter by category.",
      inputSchema: {
        category: z.enum(GLOSSARY_CATEGORIES).optional(),
      },
    },
    (args) => glossaryListHandler(db, args)
  );

  server.registerTool(
    "glossary_add",
    {
      title: "Add glossary terms",
      description:
        "Register do-not-translate terms so they stay verbatim across translations. Pass `terms` to register several in one call — they go in as a single transaction, and the result lists each one with whether it was new. Pass `term` + `category` for a single term. Idempotent and case-insensitive: an already-registered term comes back as added: false.",
      inputSchema: {
        terms: z
          .array(
            z.object({
              term: z.string().min(1),
              category: z.enum(GLOSSARY_CATEGORIES),
              notes: z.string().optional(),
            })
          )
          .min(1)
          .optional(),
        term: z.string().min(1).optional(),
        category: z.enum(GLOSSARY_CATEGORIES).optional(),
        notes: z.string().optional(),
      },
    },
    (args) => glossaryAddHandler(db, args)
  );

  server.registerTool(
    "glossary_search",
    {
      title: "Search glossary terms",
      description:
        "Case-insensitive substring lookup over glossary terms; useful to check whether a term is already registered before translating it.",
      inputSchema: {
        query: z.string().min(1),
      },
    },
    (args) => glossarySearchHandler(db, args)
  );
}

const resolveDbPath = (): string =>
  resolve(process.env.GLOSSARY_DB_PATH ?? DEFAULT_GLOSSARY_DB_PATH);

async function main(): Promise<void> {
  const db = openDb(resolveDbPath());
  await ensureSeeded(db, {
    articlesDir: resolve(
      process.env.TRANSLATE_SOURCE_PATH ?? DEFAULT_ARTICLES_DIR
    ),
    wikiSourcesPath: resolve(
      process.env.WIKI_SOURCES_PATH ?? DEFAULT_WIKI_SOURCES_PATH
    ),
  });

  const server = new McpServer({ name: "glossary", version: "0.1.0" });
  registerGlossaryTools(server, db);
  await server.connect(new StdioServerTransport());
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
