import { mock } from "bun:test";
import { readFile } from "node:fs/promises";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { plugin } from "bun";
import React from "react";
import "@testing-library/jest-dom";

GlobalRegistrator.register();

// next/image and next/link depend on the Next.js runtime, so we stub them
// with plain HTML equivalents for component tests.
mock.module("next/image", () => ({
  default(props: Record<string, unknown>) {
    const {
      src,
      alt,
      width,
      height,
      fill,
      priority,
      loading,
      placeholder,
      blurDataURL,
      quality,
      objectFit,
      objectPosition,
      ...rest
    } = props;
    return React.createElement("img", { src, alt, width, height, ...rest });
  },
}));

mock.module("next/link", () => ({
  default(props: Record<string, unknown>) {
    const {
      children,
      href,
      legacyBehavior,
      passHref,
      prefetch,
      replace,
      scroll,
      shallow,
      locale,
      ...rest
    } = props;
    return React.createElement("a", { href, ...rest }, children);
  },
}));

mock.module("next/dynamic", () => ({
  default: () =>
    function DynamicComponent() {
      return React.createElement("div", { "data-testid": "dynamic-component" });
    },
}));

// `server-only` throws on import to prevent server modules from leaking into
// client bundles. Tests intentionally exercise server modules, so neutralise it.
mock.module("server-only", () => ({}));

// MDX articles are compiled by the Next.js bundler at build time; Bun's test
// runtime has no MDX loader, so importing `page.mdx` yields only `default`
// and the `meta` named export is lost. Tests that need article metadata go
// through `getArticles()`, which dynamically imports every MDX file and
// reads `meta`. To make those tests work without standing up the full MDX
// pipeline, parse the `meta` block out of each MDX file and stub any image
// asset imports it references.

const MDX_PATTERN = /\.mdx$/;
const ASSET_PATTERN = /\.(png|jpg|jpeg|webp|gif|avif|svg)$/;
const META_BLOCK_PATTERN = /export const meta = (\{[\s\S]*?^\});?/m;
const ASSET_IMPORT_PATTERN =
  /^\s*import\s+(\w+)\s+from\s+["'][^"']+\.(?:png|jpg|jpeg|webp|gif|avif|svg)["'];?$/gm;

plugin({
  name: "test-mdx-meta",
  setup(build) {
    build.onLoad({ filter: MDX_PATTERN }, async (args) => {
      const source = await readFile(args.path, "utf8");
      const metaMatch = META_BLOCK_PATTERN.exec(source);
      if (!metaMatch) {
        return { contents: "export const meta = undefined;", loader: "ts" };
      }
      let stubs = "";
      const assetMatches = source.matchAll(ASSET_IMPORT_PATTERN);
      for (const match of assetMatches) {
        const [, identifier] = match;
        stubs += `const ${identifier} = { src: "stub-image", width: 1, height: 1 };\n`;
      }
      const contents = `${stubs}export const meta = ${metaMatch[1]};\nexport default function MDX() { return null; }\n`;
      return { contents, loader: "ts" };
    });

    build.onLoad({ filter: ASSET_PATTERN }, () => ({
      contents:
        "export default { src: 'stub-image', width: 1, height: 1 };\nexport const src = 'stub-image';\n",
      loader: "ts",
    }));
  },
});
