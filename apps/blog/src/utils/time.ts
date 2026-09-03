import dayjs, { type ConfigType } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// Reference: https://day.js.org/docs/en/display/format
const YEAR_MONTH_FORMAT = "YYYY MMM";

// eslint-disable-next-line import/prefer-default-export
export const formatMonth = (date: ConfigType) =>
  dayjs.utc(date).format(YEAR_MONTH_FORMAT);

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
