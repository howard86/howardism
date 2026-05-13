import dayjs, { type ConfigType } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// Reference: https://day.js.org/docs/en/display/format
const YEAR_MONTH_FORMAT = "YYYY MMM";

// eslint-disable-next-line import/prefer-default-export
export const formatMonth = (date: ConfigType) =>
  dayjs.utc(date).format(YEAR_MONTH_FORMAT);

export const formatDate = (dateString: string) =>
  new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// Compact form for mono meta-lines, e.g. "31 Dec 2022" — callers render it uppercase.
export const formatDateShort = (dateString: string) =>
  new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
