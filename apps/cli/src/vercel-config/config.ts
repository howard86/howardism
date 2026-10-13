import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  imageDeviceSizes,
  imageFormats,
  imageMinimumCacheTTL,
  imageQualities,
  imageSizes,
} from "../../../blog/src/config/image-config";
import { redirects } from "../../../blog/src/config/redirects";
import { getBlogSecurityHeaders } from "../../../blog/src/config/security-headers";
import { BLOG_ROOT, REPO_ROOT } from "../content/paths";

const CONFIG_PATH = join(BLOG_ROOT, "vercel.json");

export function generateVercelConfig() {
  return {
    $schema: "https://openapi.vercel.sh/vercel.json",
    bunVersion: "1.4.x",
    ignoreCommand:
      "printf '%s' \"$VERCEL_GIT_COMMIT_MESSAGE\" | grep -q 'chore(release):'",
    buildCommand: "cd ../.. && DEPLOY_TARGET=vercel bun run build",
    trailingSlash: false,
    redirects,
    headers: [
      { source: "/(.*)", headers: getBlogSecurityHeaders() },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Static files take their type from the extension; restore the feed
      // types the route handlers set.
      {
        source: "/rss/feed.xml",
        headers: [
          { key: "Content-Type", value: "application/rss+xml; charset=utf-8" },
        ],
      },
      {
        source: "/rss/feed.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/feed+json; charset=utf-8",
          },
        ],
      },
    ],
    images: {
      sizes: [...imageDeviceSizes, ...imageSizes].sort((a, b) => a - b),
      formats: [...imageFormats],
      qualities: imageQualities,
      minimumCacheTTL: imageMinimumCacheTTL,
      localPatterns: [{ pathname: "^/_next/static/media/.*$", search: "" }],
      remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    },
  };
}

async function main() {
  const expected = JSON.parse(JSON.stringify(generateVercelConfig()));
  if (process.argv.includes("--check")) {
    const actual = JSON.parse(await Bun.file(CONFIG_PATH).text());
    if (!isDeepStrictEqual(actual, expected)) {
      console.error("vercel-config: apps/blog/vercel.json is out of date");
      process.exitCode = 1;
      return;
    }
    console.log("vercel-config: apps/blog/vercel.json is up to date");
    return;
  }
  await Bun.write(CONFIG_PATH, `${JSON.stringify(expected, null, 2)}\n`);
  const formatter = Bun.spawn(
    ["bun", "x", "biome", "format", "--write", "apps/blog/vercel.json"],
    { cwd: REPO_ROOT, stdout: "inherit", stderr: "inherit" }
  );
  const exitCode = await formatter.exited;
  if (exitCode !== 0) {
    process.exitCode = exitCode;
    return;
  }
  console.log("vercel-config: wrote apps/blog/vercel.json");
}

if (import.meta.main) {
  await main();
}
