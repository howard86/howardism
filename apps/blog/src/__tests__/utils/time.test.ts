import { describe, expect, it } from "bun:test";

import { formatDate, formatDateShort, formatRelativeTime } from "@/utils/time";

const NOW = Date.parse("2026-05-06T12:00:00Z");
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("reads sub-minute gaps as 'just now', in either direction", () => {
    expect(formatRelativeTime(NOW, NOW)).toBe("just now");
    expect(formatRelativeTime(NOW - 44 * SECOND, NOW)).toBe("just now");
    expect(formatRelativeTime(NOW + 30 * SECOND, NOW)).toBe("just now");
  });

  it("picks the coarsest unit that fits", () => {
    expect(formatRelativeTime(NOW - 2 * MINUTE, NOW)).toBe("2 minutes ago");
    expect(formatRelativeTime(NOW - 5 * HOUR, NOW)).toBe("5 hours ago");
    expect(formatRelativeTime(NOW - 3 * DAY, NOW)).toBe("3 days ago");
    expect(formatRelativeTime(NOW - 10 * DAY, NOW)).toBe("10 days ago");
    expect(formatRelativeTime(NOW - 60 * DAY, NOW)).toBe("2 months ago");
    expect(formatRelativeTime(NOW - 800 * DAY, NOW)).toBe("2 years ago");
  });

  it("uses the natural English words where Intl has them", () => {
    expect(formatRelativeTime(NOW - DAY, NOW)).toBe("yesterday");
    expect(formatRelativeTime(NOW + DAY, NOW)).toBe("tomorrow");
  });

  it("formats future times as 'in …'", () => {
    expect(formatRelativeTime(NOW + 2 * HOUR, NOW)).toBe("in 2 hours");
  });
});

describe("date formatters", () => {
  it("formats a long and a short date in UTC", () => {
    expect(formatDate("2026-05-06")).toBe("May 6, 2026");
    expect(formatDateShort("2026-05-06")).toBe("6 May 2026");
  });
});
