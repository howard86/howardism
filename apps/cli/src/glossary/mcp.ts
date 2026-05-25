import type { Database } from "bun:sqlite";
import { resolve } from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  addTerm,
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

export const glossaryAddHandler = (
  db: Database,
  args: { category: string; notes?: string; term: string }
) =>
  jsonResult(
    addTerm(db, args.term, args.category, {
      notes: args.notes,
      source: "agent",
    })
  );

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
      title: "Add a glossary term",
      description:
        "Register a new do-not-translate term so it stays verbatim across translations. Idempotent and case-insensitive; returns { added: false } if the term already exists.",
      inputSchema: {
        term: z.string().min(1),
        category: z.enum(GLOSSARY_CATEGORIES),
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
