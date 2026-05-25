import { resolve } from "node:path";

import type { SeedSources } from "./seed.ts";
import {
  addTerm,
  DEFAULT_ARTICLES_DIR,
  DEFAULT_GLOSSARY_DB_PATH,
  DEFAULT_WIKI_SOURCES_PATH,
  ensureSeeded,
  GLOSSARY_CATEGORIES,
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
