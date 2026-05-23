import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { extractInternalSlugs } from "../wikilink.ts";

/**
 * One operation from the wiki's `log.md`, parsed into structured form for the
 * blog's "Currents" (home) and "Operations log" (articles) strips.
 */
export interface WikiLogEntry {
  /** `YYYY-MM-DD`. */
  date: string;
  /** `ingest` | `query` | `lint` | `compile` | `maintenance` | … */
  operation: string;
  /** Internal article slugs the entry references, deduped, in document order. */
  refs: string[];
  /** Free-text subject after the `|` in the heading. */
  subject: string;
}

export interface WikiLog {
  entries: WikiLogEntry[];
  generatedOn: string;
}

// `## [2026-05-13] ingest | Interaction Models`
const ENTRY_HEADING_RE =
  /^##\s+\[(\d{4}-\d{2}-\d{2})\]\s+([\w-]+)\s*\|\s*(.+?)\s*$/;
const LINE_SPLIT_RE = /\r?\n/;

/**
 * Parse `log.md`'s chronological entries. Entries are emitted newest-first
 * (the log is authored newest-last under a fixed preamble, so we reverse).
 */
export function buildWikiLog(args: {
  body: string;
  generatedOn: string;
}): WikiLog {
  const { body, generatedOn } = args;
  const lines = body.split(LINE_SPLIT_RE);

  const entries: WikiLogEntry[] = [];
  let current: { heading: RegExpExecArray; bodyLines: string[] } | null = null;

  const flush = () => {
    if (!current) {
      return;
    }
    const [, date, operation, subject] = current.heading;
    const entryBody = current.bodyLines.join("\n");
    entries.push({
      date,
      operation,
      subject,
      refs: extractInternalSlugs(entryBody, { dedup: true }),
    });
  };

  for (const line of lines) {
    const heading = ENTRY_HEADING_RE.exec(line);
    if (heading) {
      flush();
      current = { heading, bodyLines: [] };
      continue;
    }
    if (current) {
      current.bodyLines.push(line);
    }
  }
  flush();

  // Newest first; stable for equal dates (preserves authored order reversed).
  entries.sort((a, b) => b.date.localeCompare(a.date));

  return { entries, generatedOn };
}

export async function emitWikiLog(args: {
  dryRun?: boolean;
  log: WikiLog;
  outputPath: string;
}): Promise<string> {
  const { log, outputPath, dryRun } = args;
  const json = JSON.stringify(log);

  if (dryRun) {
    console.log(
      `[wiki-log] DRY_RUN — would write ${outputPath} (${log.entries.length} entries)`
    );
    return outputPath;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${json}\n`, "utf8");
  return outputPath;
}
