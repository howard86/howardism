import type { Database } from "bun:sqlite";
import { resolve } from "node:path";

import { harvestGlossaryCandidates } from "./harvest.ts";
import type { SeedSources } from "./seed.ts";
import {
  addTerm,
  addTerms,
  DEFAULT_ARTICLES_DIR,
  DEFAULT_GLOSSARY_DB_PATH,
  DEFAULT_WIKI_SOURCES_PATH,
  ensureSeeded,
  GLOSSARY_CATEGORIES,
  type GlossaryEntry,
  listTerms,
  openDb,
} from "./store.ts";

interface CliOptions {
  dbPath: string;
  sources: SeedSources;
}

const resolveCliOptions = (): CliOptions => {
  const env = process.env;
  return {
    // The translation orchestrator pins GLOSSARY_DB_PATH for engine
    // subprocesses so they all hit the one seeded DB.
    dbPath: resolve(env.GLOSSARY_DB_PATH ?? DEFAULT_GLOSSARY_DB_PATH),
    sources: {
      articlesDir: resolve(env.TRANSLATE_SOURCE_PATH ?? DEFAULT_ARTICLES_DIR),
      wikiSourcesPath: resolve(
        env.WIKI_SOURCES_PATH ?? DEFAULT_WIKI_SOURCES_PATH
      ),
    },
  };
};

const printUsage = (): void => {
  console.log(
    [
      "Usage:",
      "  bun src/glossary/cli.ts list",
      '  bun src/glossary/cli.ts add "<term>" <category>',
      "  bun src/glossary/cli.ts add-many '<json>'",
      "  bun src/glossary/cli.ts harvest [--add] [slug ...]",
      "",
      `Categories: ${GLOSSARY_CATEGORIES.join(" | ")}`,
      'add-many JSON shape: [{"term":"<t>","category":"<category>"}, ...]',
      "harvest: pre-scans article MDX for DNT candidates (acronyms, proper",
      "  nouns) not yet in the glossary. No slugs -> scan every article.",
      "  Dry-run by default (prints candidates); --add registers them.",
    ].join("\n")
  );
};

const parseAddManyJson = (raw: string | undefined): GlossaryEntry[] => {
  if (!raw) {
    throw new Error(
      'add-many requires a JSON array argument: \'[{"term":"<t>","category":"<c>"}, ...]\''
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`add-many: invalid JSON: ${(err as Error).message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("add-many: JSON must be an array of {term, category}");
  }
  return parsed as GlossaryEntry[];
};

async function runHarvestCommand(
  db: Database,
  opts: CliOptions,
  rest: string[]
): Promise<number> {
  const addFlag = rest.includes("--add");
  const slugs = rest.filter((a) => a !== "--add");
  const { candidates } = await harvestGlossaryCandidates(
    {
      articlesDir: opts.sources.articlesDir,
      slugs: slugs.length ? slugs : undefined,
    },
    listTerms(db)
  );

  if (candidates.length === 0) {
    console.log("harvest: no new candidate terms found");
    return 0;
  }

  if (addFlag) {
    const { added } = addTerms(
      db,
      candidates.map((c) => ({ term: c.term, category: c.category })),
      { source: "harvest" }
    );
    for (const c of candidates) {
      console.log(`added: ${c.term} (${c.category}) [${c.slugs.join(", ")}]`);
    }
    console.log(
      `harvest: added ${added} of ${candidates.length} candidate term(s)`
    );
    return 0;
  }

  for (const c of candidates) {
    console.log(`${c.term} (${c.category}) [${c.slugs.join(", ")}]`);
  }
  console.log(`harvest: ${candidates.length} candidate term(s)`);
  return 0;
}

async function runCli(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return command ? 0 : 1;
  }

  const opts = resolveCliOptions();
  const db = openDb(opts.dbPath);
  try {
    await ensureSeeded(db, opts.sources);

    if (command === "list") {
      console.log(JSON.stringify(listTerms(db), null, 2));
      return 0;
    }

    if (command === "add") {
      const [term, category] = rest;
      if (!(term && category)) {
        console.error('add requires: add "<term>" <category>');
        printUsage();
        return 1;
      }
      const result = addTerm(db, term, category);
      if (result.added) {
        console.log(`added: ${term} (${category})`);
      } else {
        console.log(`exists: ${term}`);
      }
      return 0;
    }

    if (command === "add-many") {
      let entries: GlossaryEntry[];
      try {
        entries = parseAddManyJson(rest[0]);
      } catch (err) {
        console.error((err as Error).message);
        printUsage();
        return 1;
      }
      let result: { added: number };
      try {
        result = addTerms(db, entries);
      } catch (err) {
        console.error((err as Error).message);
        return 1;
      }
      const total = listTerms(db).length;
      // One-line JSON summary — the engine consumes this on stdout to confirm
      // the batch landed; mirrors the existing `add` line's compact-and-final
      // output style.
      console.log(JSON.stringify({ added: result.added, total }));
      return 0;
    }

    if (command === "harvest") {
      return await runHarvestCommand(db, opts, rest);
    }

    console.error(`Unknown command: ${command}`);
    printUsage();
    return 1;
  } finally {
    db.close();
  }
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
