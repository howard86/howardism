import { LogEntryLine } from "@/components/howardism/log-entry-line";
import { formatDateShort } from "@/utils/time";

import {
  type ArticleTopic,
  groupWikiLogByDate,
  type WikiLogEntry,
} from "./articles/service";

interface CurrentsProps {
  entries: WikiLogEntry[];
  /** Resolve a referenced article slug to its topic, for the row dot. */
  slugTopics: Record<string, ArticleTopic | undefined>;
}

const MAX_BATCHES = 5;

/**
 * "Currents" — a glanceable strip of recent wiki operations, grouped into
 * dated columns. Backed by the importer's `wiki-log.json` (parsed from the
 * vault's `log.md`).
 */
export function Currents({ entries, slugTopics }: CurrentsProps) {
  const batches = groupWikiLogByDate(entries).slice(0, MAX_BATCHES);
  if (batches.length === 0) {
    return null;
  }

  return (
    <section className="border-border border-b bg-card/40 px-[clamp(20px,5vw,56px)] py-7">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-5">
          <span className="font-medium font-mono text-[11px] text-brand uppercase tracking-[0.22em]">
            ● Currents
          </span>
          <span className="font-display font-medium text-[22px] text-foreground tracking-[-0.01em]">
            What&apos;s <em className="text-brand italic">moved</em> recently.
          </span>
        </div>
        <a
          className="hidden whitespace-nowrap border-current border-b pb-0.5 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em] transition-colors hover:text-brand sm:inline"
          href="/articles/wiki-changelog"
        >
          Full operations log →
        </a>
      </div>

      <ol className="grid list-none grid-cols-2 gap-x-6 gap-y-5 p-0 sm:grid-cols-3 lg:grid-cols-5">
        {batches.map((batch) => (
          <li className="border-foreground border-t pt-2.5" key={batch.date}>
            <div className="font-medium font-mono text-[10.5px] text-foreground uppercase tracking-[0.16em]">
              {formatDateShort(batch.date)}
            </div>
            <ul className="mt-2.5 flex list-none flex-col gap-1.5 p-0">
              {batch.entries.map((entry, i) => (
                <li
                  className="font-body text-[13.5px] text-muted-foreground leading-[1.4]"
                  // biome-ignore lint/suspicious/noArrayIndexKey: log entries within a date have no stable id
                  key={i}
                >
                  <LogEntryLine entry={entry} slugTopics={slugTopics} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
