import { execFileSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { file, spawn } from "bun";
import { BLOG_ROOT } from "./paths";
import { prepareContent, selectProfile } from "./prepare";
import { r2Store } from "./r2";

const profile = selectProfile();
const args = process.argv.slice(2);
if (!args.length) {
  throw new Error("content-run requires a consumer command");
}
const consume = async (): Promise<void> => {
  const state = await file(`${BLOG_ROOT}/.content-state.json`).json();
  const applicationCommit =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  await file(`${BLOG_ROOT}/public/.well-known/howardism-content.json`).write(
    `${JSON.stringify({ ...state, applicationCommit })}\n`
  );
  const result = spawn(args, {
    cwd: process.cwd(),
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
      CONTENT_PROFILE: profile,
      CONTENT_ROOT: `${BLOG_ROOT}/src`,
      HOWARDISM_PREPARED_ROOT: BLOG_ROOT,
    },
  });
  const code = await result.exited;
  if (code) {
    throw new Error(`Content consumer exited ${code}`);
  }
};
// Root Turbo owns the preparation lock for child blog commands.
if (process.env.HOWARDISM_PREPARED_ROOT === BLOG_ROOT) {
  const state = await file(`${BLOG_ROOT}/.content-state.json`).json();
  const lock = await stat(`${BLOG_ROOT}/.content-prepare-lock`);
  if (state.profile !== profile || !lock.isDirectory()) {
    throw new Error("Prepared content context is invalid");
  }
  await consume();
} else {
  // Authoring must stay outside the build tree, including when CONTENT_ROOT is set.
  if (
    process.env.CONTENT_ROOT &&
    process.env.CONTENT_ROOT !== `${BLOG_ROOT}/src`
  ) {
    throw new Error(
      "Build consumers must use materialized content; validate authoring through content:validate"
    );
  }
  await prepareContent(
    {
      profile,
      ...(profile === "full" ? { store: r2Store() } : {}),
      concurrency: Number(process.env.CONTENT_DOWNLOAD_CONCURRENCY ?? 8),
      cacheBudgetBytes: Number(
        process.env.CONTENT_CACHE_BUDGET_BYTES ?? 512 * 1024 * 1024
      ),
    },
    consume
  );
}
