import { LogEntryLine } from "@/components/howardism/log-entry-line";
import { formatDateShort } from "@/utils/time";

import {
  type ArticleTopic,
  groupWikiLogByDate,
  type WikiLogEntry,
} from "./service";

interface OperationsLogProps {
  entries: WikiLogEntry[];
  slugTopics: Record<string, ArticleTopic | undefined>;
}

/**
 * "Operations log" — the vertical changelog strip at the foot of /articles,
 * backed by the importer's `wiki-log.json`.
 */
export function OperationsLog({ entries, slugTopics }: OperationsLogProps) {
  const batches = groupWikiLogByDate(entries);
  if (batches.length === 0) {
    return null;
  }

  return (
    <section className="border-border border-b px-[clamp(20px,5vw,56px)] py-9">
      <div className="grid grid-cols-1 gap-x-11 gap-y-7 lg:grid-cols-[180px_1fr]">
        <div>
          <div className="font-medium font-mono text-[10.5px] text-brand uppercase tracking-[0.22em]">
            Plate · ⊕
          </div>
          <h2 className="mt-2 font-display font-normal text-[clamp(26px,3.5vw,36px)] text-foreground leading-[1.04] tracking-[-0.022em]">
            Operations <em className="text-brand italic">log.</em>
          </h2>
          <p className="mt-1.5 max-w-[200px] font-body text-[14px] text-muted-foreground leading-[1.5]">
            Every batch, rename, and backlink — when the wiki actually moved.
          </p>
        </div>

        <ol className="m-0 list-none p-0">
          {batches.map((batch, i) => (
            <li
              className="grid grid-cols-[96px_1fr] gap-x-6 py-3"
              key={batch.date}
              style={{
                borderTop:
                  i === 0
                    ? "1px solid var(--foreground)"
                    : "1px solid var(--border)",
              }}
            >
              <span className="font-medium font-mono text-[11px] text-foreground uppercase tracking-[0.16em]">
                {formatDateShort(batch.date)}
              </span>
              <div className="flex flex-col gap-1">
                {batch.entries.map((entry, j) => (
                  <span
                    className="font-body text-[14px] text-muted-foreground leading-[1.4]"
                    // biome-ignore lint/suspicious/noArrayIndexKey: log entries within a date have no stable id
                    key={j}
                  >
                    <LogEntryLine entry={entry} slugTopics={slugTopics} />
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
