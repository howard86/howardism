import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { backupLocalState } from "./backup-local";
import { generateFixtures } from "./fixtures";
import {
  applyGarbageCollection,
  PublicationLedgerSchema,
  planGarbageCollection,
} from "./gc";
import { realR2Acceptance } from "./integration";
import { packCandidate } from "./pack";
import { BLOG_ROOT, contentPaths, REPO_ROOT } from "./paths";
import { pinRelease } from "./pin";
import { prepareContent, selectProfile } from "./prepare";
import { publishContent } from "./publish";
import { fixtureR2Store, r2Store } from "./r2";
import { packageRelease, sha256 } from "./release";
import { packSample, pinSample, publishSample } from "./sample-publish";
import { validateSnapshot } from "./validate";
import { exportBaseline } from "./workspace";

interface Options {
  "allow-large-deletion"?: boolean;
  apply?: boolean;
  "approved-plan-sha256"?: string;
  base?: string;
  bucket?: string;
  candidate?: string;
  destination?: string;
  "dry-run"?: boolean;
  help?: boolean;
  initial?: boolean;
  ledger?: string;
  "maintenance-root"?: string;
  plan?: string;
  profile?: string;
  "public-base-url"?: string;
  "publication-frozen"?: boolean;
  release?: string;
  root?: string;
}
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Required option: --${name}`);
  }
  return value;
}
async function publish(options: Options): Promise<void> {
  const root = options.candidate
    ? resolve(options.candidate, "snapshot")
    : required(options.root, "root");
  let expectedDigest: string | undefined;
  if (options.candidate) {
    required(options["maintenance-root"], "maintenance-root");
    const candidate = await packageRelease(root);
    expectedDigest = sha256(
      await Bun.file(resolve(options.candidate, "release.json")).text()
    );
    if (candidate.digest !== expectedDigest) {
      throw new Error("Packed candidate changed before publication");
    }
  }
  if ((options.profile ?? process.env.CONTENT_PROFILE ?? "full") !== "full") {
    throw new Error("Publisher requires --profile full");
  }
  const digest = await publishContent({
    root,
    store: r2Store(),
    baseDigest: options.base,
    initial: options.initial,
    allowLargeDeletion: options["allow-large-deletion"],
    expectedDigest,
    maintenanceRoot: options["maintenance-root"],
  });
  process.stdout.write(
    `${JSON.stringify({ publishedReleaseSha256: digest })}\n`
  );
}
async function gc(options: Options): Promise<void> {
  const store = r2Store();
  const ledgerPath = required(options.ledger, "ledger");
  if (options.apply) {
    if (options["dry-run"]) {
      throw new Error("Choose --apply or --dry-run");
    }
    await applyGarbageCollection({
      store,
      ledgerPath,
      planPath: required(options.plan, "plan"),
      approvedPlanSha256: required(
        options["approved-plan-sha256"],
        "approved-plan-sha256"
      ),
      maintenanceRoot: required(
        options["maintenance-root"],
        "maintenance-root"
      ),
      publicationFrozen: options["publication-frozen"] ?? false,
    });
  } else {
    const ledger = PublicationLedgerSchema.parse(
      await Bun.file(ledgerPath).json()
    );
    const plan = await planGarbageCollection(store, ledger);
    const bytes = `${JSON.stringify(plan, null, 2)}\n`;
    if (options.plan) {
      await Bun.write(options.plan, bytes);
    }
    process.stdout.write(
      `${bytes}${JSON.stringify({ dryRun: true, planSha256: sha256(bytes) })}\n`
    );
  }
}
const handlers: Record<string, (options: Options) => Promise<void>> = {
  export: async (options) => {
    await exportBaseline(
      options.root ?? contentPaths().root,
      required(options.destination, "destination")
    );
  },
  "backup-local": async (options) => {
    await backupLocalState(
      options.root ?? resolve(REPO_ROOT, "apps/cli"),
      required(options.destination, "destination")
    );
  },
  fixtures: async (options) => {
    await generateFixtures(
      required(options.root, "root"),
      required(options.destination, "destination")
    );
  },
  "fixtures-pack": async (options) => {
    const digest = await packSample(
      required(options.root, "root"),
      required(options.destination, "destination")
    );
    process.stdout.write(
      `${JSON.stringify({ sampleReleaseSha256: digest })}\n`
    );
  },
  "fixtures-publish": async (options) => {
    const bucket = required(options.bucket, "bucket");
    const digest = await publishSample({
      root: required(options.root, "root"),
      bucket,
      store: fixtureR2Store(bucket),
    });
    process.stdout.write(
      `${JSON.stringify({ sampleReleaseSha256: digest })}\n`
    );
  },
  "fixtures-pin": async (options) => {
    await pinSample(
      required(options.release, "release"),
      required(options["public-base-url"], "public-base-url"),
      BLOG_ROOT
    );
  },
  validate: async (options) => {
    await validateSnapshot(
      options.root ?? contentPaths().root,
      selectProfile({
        ...process.env,
        ...(options.profile ? { CONTENT_PROFILE: options.profile } : {}),
      })
    );
  },
  prepare: async (options) => {
    const profile = selectProfile({
      ...process.env,
      ...(options.profile ? { CONTENT_PROFILE: options.profile } : {}),
    });
    await prepareContent({
      profile,
      ...(profile === "full" ? { store: r2Store() } : {}),
      concurrency: Number(process.env.CONTENT_DOWNLOAD_CONCURRENCY ?? 8),
      cacheBudgetBytes: Number(
        process.env.CONTENT_CACHE_BUDGET_BYTES ?? 512 * 1024 * 1024
      ),
    });
  },
  pack: async (options) => {
    await packCandidate(
      required(options.root, "root"),
      required(options.destination, "destination")
    );
  },
  publish,
  pin: async (options) => {
    await pinRelease(
      required(options.release, "release"),
      r2Store(),
      BLOG_ROOT
    );
  },
  acceptance: async (options) => {
    await realR2Acceptance(required(options.root, "root"), options.base);
  },
  gc,
};
export async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    allowPositionals: true,
    options: {
      root: { type: "string" },
      destination: { type: "string" },
      release: { type: "string" },
      base: { type: "string" },
      bucket: { type: "string" },
      "public-base-url": { type: "string" },
      candidate: { type: "string" },
      profile: { type: "string" },
      ledger: { type: "string" },
      plan: { type: "string" },
      "approved-plan-sha256": { type: "string" },
      "maintenance-root": { type: "string" },
      initial: { type: "boolean" },
      "allow-large-deletion": { type: "boolean" },
      apply: { type: "boolean" },
      "dry-run": { type: "boolean" },
      "publication-frozen": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    process.stdout.write(
      `Content commands: ${Object.keys(handlers).join(", ")}\nUse --root for an external full workspace; --destination for export/pack/backup.\nprepare/validate: --profile sample|full\nfixtures: --root SOURCE --destination EXTERNAL_ROOT; fixtures-pack: --root SAMPLE --destination NEW_DIRECTORY\nfixtures-publish: --root SAMPLE --bucket BUCKET; fixtures-pin: --release DIGEST --public-base-url HTTPS_URL\npublish: --root or --candidate, --base DIGEST (or --initial), --allow-large-deletion; --candidate requires --maintenance-root ROOT\npin: --release DIGEST; acceptance: --root ROOT [--base DIGEST]\ngc: --ledger FILE [--dry-run] [--plan FILE]\ngc --apply additionally requires --approved-plan-sha256 DIGEST --maintenance-root ROOT --publication-frozen and gcApproved in the ledger.\n`
    );
    return;
  }
  const [command] = positionals;
  const handler = handlers[command];
  if (!handler) {
    throw new Error("Unknown content command; use --help");
  }
  await handler(values);
}
if (import.meta.main) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    );
    process.exitCode = 1;
  }
}
