// Benchmarks utils/time.ts's date formatters (O1): a module-scope
// Intl.DateTimeFormat instance vs. building fresh options into
// toLocaleDateString on every call.
import { formatDate, formatDateShort } from "../src/utils/time";
import { bench, checksum, log } from "./harness";

const DATE_COUNT = 427;
const STEP_DAYS = 3;
const MS_PER_DAY = 86_400_000;
const START_MS = Date.UTC(2020, 0, 1);

const DATES = Array.from({ length: DATE_COUNT }, (_, i) =>
  new Date(START_MS + i * STEP_DAYS * MS_PER_DAY).toISOString().slice(0, 10)
);

const longOutput = bench("formatDate (en-US, long)", () =>
  DATES.map(formatDate).join("\n")
);
log(`  checksum: ${checksum(longOutput)}`);

const shortOutput = bench("formatDateShort (en-GB, short)", () =>
  DATES.map(formatDateShort).join("\n")
);
log(`  checksum: ${checksum(shortOutput)}`);
