/**
 * Build the sync-only design-system package Claude Design consumes:
 *
 *   dist/index.js    ESM bundle of entry.ts; react/react-dom stay external.
 *   dist/index.d.ts  declarations (tsc), re-exported from dist/types.
 *   dist/styles.css  Tailwind v4 compiled from the blog's globals.css, scanning
 *                    the ui and blog sources so every class they use exists,
 *                    with the three Google font families imported first.
 *
 * Neither source has a build of its own: @howardism/ui ships .tsx and Tailwind
 * source CSS, and the editorial components live inside the Next.js app. Two
 * things are resolved here rather than by node resolution:
 *   - `@/` means packages/ui/src inside ui files and apps/blog/src inside blog
 *     files; the only path present in both trees is styles/globals.css, which
 *     no TS file imports, so "ui first, then blog" picks the right file.
 *   - next/link and next/navigation become the stand-ins in shims/.
 *
 *   bun run --cwd packages/design-system build:design-sync
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

import tailwind from "@tailwindcss/postcss";
import type { BunPlugin } from "bun";
import postcss from "postcss";

const PKG = import.meta.dir;
const ROOT = resolve(PKG, "../..");
const UI_SRC = join(ROOT, "packages/ui/src");
const BLOG_SRC = join(ROOT, "apps/blog/src");
const DIST = join(PKG, "dist");
const EXTS = ["", ".tsx", ".ts", "/index.tsx", "/index.ts"];

const NEXT_LINK_RE = /^next\/link$/;
const NEXT_NAVIGATION_RE = /^next\/navigation$/;
const UI_ALIAS_RE = /^@howardism\/ui\//;
const AT_ALIAS_RE = /^@\//;

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap";

function firstExisting(base: string): string | undefined {
  for (const ext of EXTS) {
    const candidate = base + ext;
    if (existsSync(candidate) && !candidate.endsWith("/")) {
      try {
        if (Bun.file(candidate).size > 0) {
          return candidate;
        }
      } catch {
        // a directory - try the next extension
      }
    }
  }
  return undefined;
}

const aliases: BunPlugin = {
  name: "design-sync-aliases",
  setup(build) {
    build.onResolve({ filter: NEXT_LINK_RE }, () => ({
      path: join(PKG, "shims/next-link.tsx"),
    }));
    build.onResolve({ filter: NEXT_NAVIGATION_RE }, () => ({
      path: join(PKG, "shims/next-navigation.ts"),
    }));
    build.onResolve({ filter: UI_ALIAS_RE }, (args) => {
      const hit = firstExisting(
        join(UI_SRC, args.path.slice("@howardism/ui/".length))
      );
      return hit ? { path: hit } : undefined;
    });
    build.onResolve({ filter: AT_ALIAS_RE }, (args) => {
      const rest = args.path.slice(2);
      const hit =
        firstExisting(join(UI_SRC, rest)) ??
        firstExisting(join(BLOG_SRC, rest));
      if (!hit) {
        throw new Error(`unresolved ${args.path} (from ${args.importer})`);
      }
      return { path: hit };
    });
  },
};

async function buildJs(): Promise<void> {
  const result = await Bun.build({
    entrypoints: [join(PKG, "entry.ts")],
    outdir: DIST,
    naming: "index.js",
    target: "browser",
    format: "esm",
    external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"],
    plugins: [aliases],
    define: { "process.env.NODE_ENV": '"production"' },
  });
  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    throw new Error("JS build failed");
  }
}

function buildTypes(): void {
  try {
    execFileSync(
      join(ROOT, "node_modules/.bin/tsc"),
      ["-p", join(PKG, "tsconfig.json")],
      { stdio: "pipe" }
    );
  } catch (error) {
    // Type errors in the app graph (e.g. missing content manifests) don't stop
    // emit; only a missing entry declaration is fatal, checked below.
    const out = String((error as { stdout?: Buffer }).stdout ?? "");
    const count = out.split("\n").filter((l) => l.includes("error TS")).length;
    console.error(`[types] tsc reported ${count} type errors; emit continues`);
  }
  const entryDts = join(DIST, "types/packages/design-system/entry.d.ts");
  if (!existsSync(entryDts)) {
    throw new Error(`tsc emitted no ${entryDts}`);
  }
}

async function buildCss(): Promise<void> {
  const from = join(PKG, "styles.src.css");
  const source = await Bun.file(from).text();
  const result = await postcss([tailwind({ base: ROOT })]).process(source, {
    from,
  });
  await Bun.write(
    join(DIST, "styles.css"),
    `@import url("${FONTS_URL}");\n${result.css}`
  );
}

await rm(DIST, { force: true, recursive: true });
await mkdir(DIST, { recursive: true });
await buildJs();
buildTypes();
await Bun.write(
  join(DIST, "index.d.ts"),
  'export * from "./types/packages/design-system/entry";\n'
);
await buildCss();
console.error(`[build] wrote ${dirname(join(DIST, "index.js"))}`);
