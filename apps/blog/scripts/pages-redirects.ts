// Run after `DEPLOY_TARGET=pages next build`: static export has no redirects,
// so write a meta-refresh stub at each old URL listed in `src/config/redirects`.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { WIKI_DOMAINS } from "@howardism/article-contract";

import { type RedirectRule, redirects } from "../src/config/redirects";

const PARAM_PATTERN = /:(\w+)/;
const CANONICAL_ORIGIN = "https://www.howardism.dev";
const OUT_DIR = join(import.meta.dir, "..", "out");

// The five `topic` buckets retired by the domain-MOC migration (741b78ec),
// recovered from `WIKI_TOPICS` in git history.
const LEGACY_TOPICS = [
  "interaction",
  "architecture",
  "harness",
  "alignment",
  "orgs",
];

const PARAM_VALUES: Record<string, readonly string[]> = {
  "/articles/topic/:slug": LEGACY_TOPICS,
  "/articles/moc-:domain": WIKI_DOMAINS,
};

/** Expand parameterised redirect rules into concrete `{ source, destination }` pairs. */
export function expandRedirects(
  rules: readonly RedirectRule[],
  paramValues: Record<string, readonly string[]> = PARAM_VALUES
): { source: string; destination: string }[] {
  return rules.flatMap(({ source, destination }) => {
    const param = source.match(PARAM_PATTERN)?.[1];
    if (!param) {
      return [{ source, destination }];
    }
    const values = paramValues[source];
    if (!values) {
      console.warn(`pages-redirects: no values for "${source}", skipping`);
      return [];
    }
    return values.map((value) => ({
      source: source.replace(`:${param}`, value),
      destination: destination.replace(`:${param}`, value),
    }));
  });
}

const withTrailingSlash = (path: string) =>
  path.endsWith("/") ? path : `${path}/`;

export function renderRedirectStub(destination: string): string {
  const target = withTrailingSlash(destination);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${CANONICAL_ORIGIN}${target}">
<meta name="robots" content="noindex">
</head>
<body><a href="${target}">Continue to ${target}</a></body>
</html>
`;
}

async function main() {
  if (!existsSync(OUT_DIR)) {
    console.error(`pages-redirects: ${OUT_DIR} not found; build first`);
    process.exit(1);
  }
  const stubs = expandRedirects(redirects)
    .map(({ source, destination }) => ({
      file: join(OUT_DIR, source, "index.html"),
      destination,
    }))
    .filter(({ file }) => !existsSync(file));
  await Promise.all(
    stubs.map(({ file, destination }) =>
      Bun.write(file, renderRedirectStub(destination))
    )
  );
  console.log(`pages-redirects: wrote ${stubs.length} stubs`);
}

if (import.meta.main) {
  await main();
}
