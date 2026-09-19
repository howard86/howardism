const LONG_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDate = (dateString: string) =>
  LONG_DATE_FORMAT.format(new Date(`${dateString}T00:00:00Z`));

// Compact form for mono meta-lines, e.g. "31 Dec 2022" — callers render it uppercase.
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const formatDateShort = (dateString: string) =>
  SHORT_DATE_FORMAT.format(new Date(`${dateString}T00:00:00Z`));

const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

/** Anything fresher than this reads as "just now" rather than "N seconds ago". */
const JUST_NOW_SECONDS = 45;

/**
 * Seconds per unit, coarsest first — the first one that fits wins. No "week":
 * dayjs's `relativeTime` went straight from days to months, and with
 * `numeric: "auto"` a week would surface as the vaguer "last week" where
 * "10 days ago" is both truer and what the Shelf used to say.
 */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60],
  ["month", 30 * 24 * 60 * 60],
  ["day", 24 * 60 * 60],
  ["hour", 60 * 60],
  ["minute", 60],
];

/**
 * "3 days ago", "yesterday", "in 2 hours", "just now" — the Shelf's relative
 * timestamps, from `Intl.RelativeTimeFormat` rather than dayjs's
 * `relativeTime` plugin (45 KB of client JS for this one call site).
 *
 * `numeric: "auto"` is what turns -1 day into "yesterday" instead of "1 day
 * ago"; the sub-minute band is special-cased because "now"/"0 seconds ago"
 * both read badly next to "saved".
 */
export function formatRelativeTime(
  timestampMs: number,
  nowMs: number = Date.now()
): string {
  const seconds = (timestampMs - nowMs) / 1000;
  if (Math.abs(seconds) < JUST_NOW_SECONDS) {
    return "just now";
  }
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return RELATIVE_TIME_FORMAT.format(
        Math.round(seconds / unitSeconds),
        unit
      );
    }
  }
  return RELATIVE_TIME_FORMAT.format(Math.round(seconds / 60), "minute");
}
