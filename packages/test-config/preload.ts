import { mock } from "bun:test";
import { readFile } from "node:fs/promises";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { plugin } from "bun";
import React from "react";
import YAML from "yaml";
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
// runtime has no MDX loader, so importing `page.mdx` yields raw text. To make
// tests that go through `getArticles()` work without the full MDX pipeline,
// parse YAML frontmatter directly and stub the `heroImage` named export plus
// any other static-image assets the file references.

const MDX_PATTERN = /\.mdx$/;
const ASSET_PATTERN = /\.(png|jpg|jpeg|webp|gif|avif|svg)$/;
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---/;
const STUB_IMAGE = '{ src: "stub-image", width: 1, height: 1 }';

plugin({
  name: "test-mdx-meta",
  setup(build) {
    build.onLoad({ filter: MDX_PATTERN }, async (args) => {
      const source = await readFile(args.path, "utf8");
      const fmMatch = FRONTMATTER_PATTERN.exec(source);
      const meta = fmMatch ? YAML.parse(fmMatch[1]) : undefined;
      const metaLiteral =
        meta === undefined ? "undefined" : JSON.stringify(meta);
      const contents = [
        `export const meta = ${metaLiteral};`,
        `export const heroImage = ${STUB_IMAGE};`,
        "export default function MDX() { return null; }",
      ].join("\n");
      return { contents, loader: "ts" };
    });

    build.onLoad({ filter: ASSET_PATTERN }, () => ({
      contents: `export default ${STUB_IMAGE};\nexport const src = "stub-image";\n`,
      loader: "ts",
    }));
  },
});
