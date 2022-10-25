import dayjs, { ConfigType } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

// Reference: https://day.js.org/docs/en/display/format
const YEAR_MONTH_FORMAT = "YYYY MMM";

// eslint-disable-next-line import/prefer-default-export
export const formatMonth = (date: ConfigType) => dayjs.utc(date).format(YEAR_MONTH_FORMAT);
