"use client";

import type { WikiDomain } from "@howardism/article-contract";
import { cn } from "@howardism/ui/lib/utils";
import {
  type CSSProperties,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

import { DOMAIN_META, DOMAIN_ORDER } from "../articles/domain-meta";
import { ConceptStanza } from "../articles/open-questions-section";
import type { OpenQuestionConcept } from "../articles/service";
import {
  TRIAGE_META,
  TRIAGE_ORDER,
  type TriageBucket,
} from "../articles/triage-meta";
import { applyBucket, buildStanzas, filterStanzas } from "./questions-filter";

type Sort = "concept" | "weight";

const CHIP_CLASS =
  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors";
const SEG_BUTTON_CLASS =
  "border-border border-r px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors last:border-r-0";
const META_CLASS =
  "font-mono text-[10.5px] text-foreground-subtle uppercase tabular-nums tracking-[0.16em]";

const SORTS: [Sort, string][] = [
  ["concept", "Filed"],
  ["weight", "Most open"],
];

const WHITESPACE = /\s+/;
const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;

/** A line matches only when its concept title or its text holds every token. */
const tokenize = (query: string): string[] =>
  query.toLowerCase().split(WHITESPACE).filter(Boolean);

const escapeToken = (token: string): string =>
  token.replace(REGEX_SPECIALS, "\\$&");

/**
 * One segmented sort button. These three and the chip/tally rows below are
 * components rather than inline `() => setX(key)` props so each control keeps a
 * stable handler as the list re-renders on every keystroke.
 */
function SortButton({
  label,
  onSelect,
  selected,
  value,
}: {
  label: string;
  onSelect: (value: Sort) => void;
  selected: boolean;
  value: Sort;
}) {
  const handleClick = useCallback(() => onSelect(value), [onSelect, value]);
  return (
    <button
      aria-pressed={selected}
      className={cn(
        SEG_BUTTON_CLASS,
        selected
          ? "bg-accent text-foreground"
          : "text-foreground-subtle hover:bg-secondary hover:text-foreground"
      )}
      onClick={handleClick}
      type="button"
    >
      {label}
    </button>
  );
}

/** One triage bucket in the tally band, with its share-of-peak bar. */
function TriageTallyButton({
  bucketKey,
  count,
  dimmed,
  onSelect,
  peak,
  selected,
}: {
  bucketKey: TriageBucket;
  count: number;
  dimmed: boolean;
  onSelect: (next: TriageBucket | null) => void;
  peak: number;
  selected: boolean;
}) {
  const meta = TRIAGE_META[bucketKey];
  const handleClick = useCallback(
    () => onSelect(selected ? null : bucketKey),
    [bucketKey, onSelect, selected]
  );
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "group min-w-[112px] flex-1 shrink-0 text-left transition-opacity",
        dimmed && "opacity-45"
      )}
      onClick={handleClick}
      type="button"
    >
      <span
        className={cn(
          "flex items-baseline justify-between gap-2 font-mono text-[10.5px] uppercase tabular-nums tracking-[0.14em] transition-colors",
          selected
            ? "text-foreground"
            : "text-foreground-subtle group-hover:text-foreground"
        )}
      >
        <span>{meta.label}</span>
        <span>{count}</span>
      </span>
      <span
        aria-hidden="true"
        className="mt-1.5 block h-[3px] w-full bg-border"
      >
        <span
          className="block h-full bg-[var(--tone)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={
            {
              "--tone": meta.tone,
              width: `${(count / peak) * 100}%`,
            } as CSSProperties
          }
        />
      </span>
    </button>
  );
}

/** One domain filter chip. Clicking the active chip clears the filter. */
function DomainChip({
  count,
  domainKey,
  onSelect,
  selected,
}: {
  count: number | undefined;
  domainKey: WikiDomain;
  onSelect: (next: WikiDomain | null) => void;
  selected: boolean;
}) {
  const handleClick = useCallback(
    () => onSelect(selected ? null : domainKey),
    [domainKey, onSelect, selected]
  );
  return (
    <button
      aria-pressed={selected}
      className={cn(
        CHIP_CLASS,
        selected
          ? "border-[var(--dc)] bg-card text-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      )}
      onClick={handleClick}
      style={{ "--dc": DOMAIN_META[domainKey].color } as CSSProperties}
      type="button"
    >
      <span aria-hidden="true" className="size-2 rounded-full bg-[var(--dc)]" />
      {DOMAIN_META[domainKey].label}
      <span className="text-foreground-subtle">{count}</span>
    </button>
  );
}

export function QuestionsWorklist({
  concepts,
}: {
  concepts: OpenQuestionConcept[];
}) {
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<TriageBucket | null>(null);
  const [domain, setDomain] = useState<WikiDomain | null>(null);
  const [sort, setSort] = useState<Sort>("concept");
  const inputRef = useRef<HTMLInputElement>(null);
  // Guards the URL writer so it cannot blank the query string on first commit,
  // before the reader below has restored the state a shared link carried in.
  const hydrated = useRef(false);

  const stanzas = useMemo(() => buildStanzas(concepts), [concepts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get("q");
    const nextBucket = params.get("kind");
    const nextDomain = params.get("domain");
    const nextSort = params.get("sort");
    if (nextQuery) {
      setQuery(nextQuery);
    }
    if (nextBucket && TRIAGE_ORDER.includes(nextBucket as TriageBucket)) {
      setBucket(nextBucket as TriageBucket);
    }
    if (nextDomain && DOMAIN_ORDER.includes(nextDomain as WikiDomain)) {
      setDomain(nextDomain as WikiDomain);
    }
    if (nextSort === "weight") {
      setSort("weight");
    }
    hydrated.current = true;
  }, []);

  // Filters live in the URL so a worked-down view stays linkable and survives a
  // reload — the page is prerendered, so this is a client-side replace only.
  useEffect(() => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: the ref is flipped by the hydration effect above, which biome does not track across effects
    if (!hydrated.current) {
      return;
    }
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (bucket) {
      params.set("kind", bucket);
    }
    if (domain) {
      params.set("domain", domain);
    }
    if (sort !== "concept") {
      params.set("sort", sort);
    }
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      search ? `?${search}` : window.location.pathname
    );
  }, [query, bucket, domain, sort]);

  const focusSearch = useCallback(() => inputRef.current?.focus(), []);
  useKeyboardShortcut("/", focusSearch);

  // Filtering and highlighting walk every line in the backlog, so let the
  // input paint the typed character first and narrow against the settled
  // query — the same trade the search palette makes.
  const deferredQuery = useDeferredValue(query);
  const tokens = useMemo(() => tokenize(deferredQuery), [deferredQuery]);
  const pattern = useMemo(
    () =>
      tokens.length === 0
        ? null
        : new RegExp(`(${tokens.map(escapeToken).join("|")})`, "gi"),
    [tokens]
  );

  // Text and domain narrow the corpus; the bucket filter is applied after, so
  // the tally can keep showing what the other buckets hold under this search.
  const scoped = useMemo(
    () => filterStanzas(stanzas, tokens, domain),
    [stanzas, domain, tokens]
  );

  const counts = useMemo(() => {
    const tally = new Map<TriageBucket, number>();
    for (const stanza of scoped) {
      for (const line of stanza.lines) {
        tally.set(line.bucket, (tally.get(line.bucket) ?? 0) + 1);
      }
    }
    return tally;
  }, [scoped]);

  const domainCounts = useMemo(() => {
    const tally = new Map<WikiDomain, number>();
    for (const stanza of stanzas) {
      const open = stanza.lines.filter(
        (line) => line.bucket !== "resolved"
      ).length;
      tally.set(stanza.domain, (tally.get(stanza.domain) ?? 0) + open);
    }
    return tally;
  }, [stanzas]);

  const results = useMemo(() => {
    const filtered = applyBucket(scoped, bucket);
    if (sort !== "weight") {
      return filtered;
    }
    // `applyBucket` hands back the memoised `scoped` array itself for the null
    // bucket, so the sort has to take a copy — sorting in place would reorder
    // the memo and leave "Filed" showing weight order ever after.
    return [...filtered].sort(
      (a, b) =>
        b.lines.length - a.lines.length || a.title.localeCompare(b.title)
    );
  }, [scoped, bucket, sort]);

  const shownLines = results.reduce(
    (sum, stanza) => sum + stanza.lines.length,
    0
  );
  const totalLines = stanzas.reduce(
    (sum, stanza) => sum + stanza.lines.length,
    0
  );
  const filtered = Boolean(query || bucket || domain);

  const activeBuckets = TRIAGE_ORDER.filter(
    (key) => (counts.get(key) ?? 0) > 0 || key === bucket
  );
  // With a single bucket in play there is no distribution to read, so the tally
  // band would be a decorative full-width bar. It appears once the vault's
  // triage tags actually split the backlog.
  const showTally =
    TRIAGE_ORDER.filter((key) => (counts.get(key) ?? 0) > 0).length > 1;
  const peak = Math.max(1, ...activeBuckets.map((key) => counts.get(key) ?? 0));

  const clearAll = useCallback(() => {
    setQuery("");
    setBucket(null);
    setDomain(null);
  }, []);

  const clearDomain = useCallback(() => setDomain(null), []);

  const handleQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setQuery(event.target.value),
    []
  );

  const handleQueryKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        setQuery("");
      }
    },
    []
  );

  return (
    <>
      <div className="sticky top-20 z-30 -mx-3 mt-8 border-border border-b bg-background/85 px-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 pb-2.5">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border px-3 py-1.5 focus-within:border-ring">
            <span aria-hidden="true" className={META_CLASS}>
              Find
            </span>
            <input
              aria-label="Search open questions"
              className="min-w-0 flex-1 bg-transparent font-body text-[15px] text-foreground outline-none placeholder:text-foreground-subtle"
              onChange={handleQueryChange}
              onKeyDown={handleQueryKeyDown}
              placeholder="a word in the question, or a concept…"
              ref={inputRef}
              type="search"
              value={query}
            />
            {query.length === 0 && (
              <kbd
                className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-foreground-subtle sm:block"
                title="Press / to search"
              >
                /
              </kbd>
            )}
          </div>
          <span className={META_CLASS}>
            {filtered
              ? `${shownLines} of ${totalLines}`
              : `${totalLines} lines`}
            <span className="mx-1.5 opacity-50">·</span>
            {results.length} concepts
          </span>
          <fieldset
            aria-label="Sort concepts"
            className="flex overflow-hidden rounded-lg border border-border bg-card"
          >
            {SORTS.map(([key, label]) => (
              <SortButton
                key={key}
                label={label}
                onSelect={setSort}
                selected={sort === key}
                value={key}
              />
            ))}
          </fieldset>
        </div>

        {showTally && (
          <fieldset aria-label="Filter by triage" className="min-w-0">
            <div className="flex min-w-0 gap-x-6 gap-y-3 overflow-x-auto pb-3">
              {activeBuckets.map((key) => (
                <TriageTallyButton
                  bucketKey={key}
                  count={counts.get(key) ?? 0}
                  dimmed={bucket !== null && bucket !== key}
                  key={key}
                  onSelect={setBucket}
                  peak={peak}
                  selected={bucket === key}
                />
              ))}
            </div>
          </fieldset>
        )}

        {/* Chrome propagates a fieldset's content min-size to its ancestors even
            when the fieldset is a `min-width: 0` scroll container, so fourteen
            chips would push the whole page frame wider than the viewport. The
            scroll container has to be an ordinary element inside it. Above `sm`
            they wrap instead: a domain you cannot see is a filter you never use. */}
        <fieldset aria-label="Filter by domain" className="min-w-0">
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-3 sm:flex-wrap sm:overflow-visible">
            <button
              aria-pressed={domain === null}
              className={cn(
                CHIP_CLASS,
                domain === null
                  ? "border-foreground-subtle text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
              onClick={clearDomain}
              type="button"
            >
              All domains
            </button>
            {DOMAIN_ORDER.filter((key) => (domainCounts.get(key) ?? 0) > 0).map(
              (key) => (
                <DomainChip
                  count={domainCounts.get(key)}
                  domainKey={key}
                  key={key}
                  onSelect={setDomain}
                  selected={domain === key}
                />
              )
            )}
          </div>
        </fieldset>
      </div>

      {results.length > 0 ? (
        <ul className="m-0 mt-8 flex list-none flex-col gap-7 p-0">
          {results.map((stanza) => (
            <ConceptStanza
              color={DOMAIN_META[stanza.domain].color}
              key={stanza.slug}
              lines={stanza.lines}
              pattern={pattern}
              slug={stanza.slug}
              title={stanza.title}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-10">
          <p className="m-0 max-w-[56ch] font-body text-[15px] text-muted-foreground leading-[1.6]">
            Nothing in the backlog matches{" "}
            {query ? (
              <b className="font-medium text-foreground">“{query}”</b>
            ) : null}
            {query && (bucket || domain) ? " under " : null}
            {bucket ? (
              <b className="font-medium text-foreground">
                {TRIAGE_META[bucket].label}
              </b>
            ) : null}
            {bucket && domain ? " in " : null}
            {domain ? (
              <b className="font-medium text-foreground">
                {DOMAIN_META[domain].label}
              </b>
            ) : null}
            . Widen it, or clear the filters and read the whole worklist.
          </p>
          <button
            className="mt-5 inline-block font-mono text-[11px] text-brand uppercase tracking-[0.16em] transition-colors hover:text-foreground"
            onClick={clearAll}
            type="button"
          >
            Clear filters →
          </button>
        </div>
      )}
    </>
  );
}
