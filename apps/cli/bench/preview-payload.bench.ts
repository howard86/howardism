// Measures the InternalLink hover-preview payload (see M1): today
// `index-row.tsx` passes the whole `ArticleMeta` — including `sources[]` —
// into a client component that only reads tag/title/description. Compares
// JSON + gzip bytes of the full meta vs. the narrowed, pre-truncated preview
// over every Concept-tagged article (285 — the size of /articles/tag/concept's
// rows). Frontmatter IS the ArticleMeta shape (lifted verbatim by
// remark-mdx-frontmatter), so gray-matter's `data` stands in for it directly.
import { gzipSync } from "node:zlib";

import matter from "gray-matter";

import { bench, checksum, log, readCorpus } from "./harness.ts";

const PREVIEW_DESCRIPTION_MAX = 140;

// Mirrors apps/blog/src/utils/text.ts — not importable cross-app (blog has no
// gray-matter dependency, so this bench lives in apps/cli; see CLAUDE.md).
function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

const fullMetas = readCorpus()
  .map((file) => matter(file.text, {}).data as Record<string, unknown>)
  .filter((data) => data.tag === "Concept");

const previews = fullMetas.map((meta) => ({
  tag: meta.tag,
  title: meta.title,
  description: truncate(
    String(meta.description ?? ""),
    PREVIEW_DESCRIPTION_MAX
  ),
}));

const fullJson = bench("JSON.stringify — full ArticleMeta", () =>
  JSON.stringify(fullMetas)
);
const previewJson = bench("JSON.stringify — narrowed ArticlePreview", () =>
  JSON.stringify(previews)
);
const fullGzip = bench("gzip — full ArticleMeta", () => gzipSync(fullJson));
const previewGzip = bench("gzip — narrowed ArticlePreview", () =>
  gzipSync(previewJson)
);

log(
  `${fullMetas.length} entries — raw: full=${fullJson.length}B narrowed=${previewJson.length}B   gzip: full=${fullGzip.length}B narrowed=${previewGzip.length}B`
);
log(`checksum full=${checksum(fullMetas)} narrowed=${checksum(previews)}`);
