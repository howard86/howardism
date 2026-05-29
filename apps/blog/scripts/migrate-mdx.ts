/**
 * One-shot codemod that rewrites each `page.mdx` from the legacy
 * `export const meta = {...}` + `<Image>` + `<Link>` JSX shape into the
 * new YAML-frontmatter + `heroImage` re-export + markdown-link shape.
 *
 * Run from `apps/blog`:
 *   bun run scripts/migrate-mdx.ts
 *
 * Idempotent: files that already begin with `---` are skipped.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import glob from "fast-glob";
import YAML from "yaml";

const DOCS_DIR = resolve(
  import.meta.dirname,
  "../src/app/(blog)/articles/[slug]/(docs)"
);

const META_BLOCK_RE = /export const meta = (\{[\s\S]*?^\});?/m;
const ASSET_IMPORT_RE =
  /^import\s+(\w+)\s+from\s+["']([^"']+\.(?:png|jpg|jpeg|webp|gif|avif|svg))["'];?\s*$/gm;
const MDX_IMAGE_IMPORT_RE =
  /^import\s+Image\s+from\s+["']@\/components\/mdx-image["'];?\s*$/m;
// Inline hero render: `<Image placeholder="blur" {...meta.image} />` (and
// minor variants with attribute order swapped). Match across the line.
const HERO_RENDER_RE =
  /^<Image\s+(?:placeholder=\{?["']blur["']\}?\s+)?\{\.\.\.meta\.image\}(?:\s+placeholder=\{?["']blur["']\}?)?\s*\/>\s*$/m;
const BODY_IMAGE_TAG_RE = /<Image\b/;
const LINK_JSX_RE = /<Link\s+href=["']([^"']+)["']\s*>([\s\S]*?)<\/Link>/g;
const TRAILING_BLANKS_RE = /\n{3,}/g;
const BINDING_MARKER_RE = /^__BINDING_(\w+)__$/;
const LEADING_WHITESPACE_RE = /^\s+/;

// Legacy posts use ad-hoc tags ("Personal", "Engineering") that predate the
// wiki taxonomy. The wiki tag union is the source of truth post-migration;
// archived posts fold into "Essay" since that's their structural shape.
const TAG_MIGRATIONS: Record<string, string> = {
  Personal: "Essay",
  Engineering: "Essay",
  Fundamentals: "Essay",
};
const VALID_TAGS = new Set(["Concept", "Entity", "Essay", "Index"]);

interface LegacyMeta {
  archived?: boolean;
  date?: string;
  description?: string;
  dropCap?: boolean;
  image?: { alt?: string; src?: string };
  readingTime?: number;
  tag?: string;
  title?: string;
}

interface AssetImport {
  binding: string;
  path: string;
}

function collectAssetImports(source: string): AssetImport[] {
  const imports: AssetImport[] = [];
  for (const match of source.matchAll(ASSET_IMPORT_RE)) {
    imports.push({ binding: match[1], path: match[2] });
  }
  return imports;
}

function parseLegacyMeta(source: string, assets: AssetImport[]): LegacyMeta {
  const match = META_BLOCK_RE.exec(source);
  if (!match) {
    throw new Error("Could not find `export const meta = {...}` block");
  }
  let sanitized = match[1];
  // Replace every asset-import binding with a quoted placeholder so the
  // function-eval doesn't trip over an unresolved identifier.
  for (const { binding } of assets) {
    const re = new RegExp(`\\b${binding}\\b`, "g");
    sanitized = sanitized.replace(re, `"__BINDING_${binding}__"`);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const meta = new Function(`return (${sanitized});`)() as LegacyMeta;
  return meta;
}

function resolveHero(meta: LegacyMeta, assets: AssetImport[]): AssetImport {
  // After parseLegacyMeta, meta.image.src is the placeholder string
  // `"__BINDING_<name>__"`. Map it back to the asset import.
  const srcMarker = meta.image?.src;
  if (typeof srcMarker === "string") {
    const matchBinding = BINDING_MARKER_RE.exec(srcMarker);
    if (matchBinding) {
      const found = assets.find((a) => a.binding === matchBinding[1]);
      if (found) {
        return found;
      }
    }
  }
  // Fallback: if there's only one asset import, that's the hero.
  if (assets.length === 1) {
    return assets[0];
  }
  // Fallback: prefer a binding literally named `heroImage`.
  const named = assets.find((a) => a.binding === "heroImage");
  if (named) {
    return named;
  }
  throw new Error(
    `Could not resolve hero image binding. Marker=${srcMarker} Assets=${assets
      .map((a) => a.binding)
      .join(",")}`
  );
}

function normalizeTag(rawTag: string | undefined, path: string): string {
  if (!rawTag) {
    throw new Error(`Missing tag in ${path}`);
  }
  const mapped = TAG_MIGRATIONS[rawTag] ?? rawTag;
  if (!VALID_TAGS.has(mapped)) {
    throw new Error(
      `Tag "${rawTag}" is not in the wiki taxonomy and has no migration mapping (${path})`
    );
  }
  return mapped;
}

function buildFrontmatter(legacy: LegacyMeta, path: string): string {
  const fm: Record<string, unknown> = {
    date: legacy.date,
    title: legacy.title,
    description: legacy.description,
    tag: normalizeTag(legacy.tag, path),
    readingTime: legacy.readingTime,
    imageAlt: legacy.image?.alt ?? `Illustration for ${legacy.title ?? ""}`,
  };
  if (legacy.dropCap !== undefined) {
    fm.dropCap = legacy.dropCap;
  }
  if (legacy.archived !== undefined) {
    fm.archived = legacy.archived;
  }
  return YAML.stringify(fm).trimEnd();
}

function convertJsxLinks(body: string): string {
  return body.replace(LINK_JSX_RE, (_full, href: string, inner: string) => {
    const text = inner.trim();
    return `[${text}](${href})`;
  });
}

function stripImports(body: string, heroBinding: string): string {
  // Drop the hero binding's `import` line entirely (it becomes a re-export).
  const heroImportRe = new RegExp(
    `^import\\s+${heroBinding}\\s+from\\s+["'][^"']+["'];?\\s*$`,
    "m"
  );
  const next = body.replace(heroImportRe, "");
  // Drop the `Image` import only if no body `<Image>` tags remain after we
  // strip the hero render.
  return next;
}

function stripHeroRender(body: string): string {
  return body.replace(HERO_RENDER_RE, "");
}

interface MigrationResult {
  path: string;
  status: "migrated" | "skipped";
}

async function migrateFile(path: string): Promise<MigrationResult> {
  const source = await readFile(path, "utf8");

  if (source.startsWith("---\n")) {
    return { path, status: "skipped" };
  }

  const assets = collectAssetImports(source);
  const legacy = parseLegacyMeta(source, assets);
  const hero = resolveHero(legacy, assets);
  const frontmatter = buildFrontmatter(legacy, path);

  // Drop the `export const meta = {...}` block.
  let body = source.replace(META_BLOCK_RE, "");
  body = stripImports(body, hero.binding);
  body = stripHeroRender(body);
  body = convertJsxLinks(body);

  // After stripping hero render, decide whether to drop the Image import.
  const stillHasBodyImage = BODY_IMAGE_TAG_RE.test(body);
  if (!stillHasBodyImage) {
    body = body.replace(MDX_IMAGE_IMPORT_RE, "");
  }

  body = body.replace(LEADING_WHITESPACE_RE, "");
  body = body.replace(TRAILING_BLANKS_RE, "\n\n");

  const result = [
    "---",
    frontmatter,
    "---",
    `export { default as heroImage } from "${hero.path}";`,
    "",
    body.trimEnd(),
    "",
  ].join("\n");

  await writeFile(path, result, "utf8");
  return { path, status: "migrated" };
}

async function main(): Promise<void> {
  const filenames = await glob("**/page.mdx", { cwd: DOCS_DIR });
  if (filenames.length === 0) {
    console.error(`No page.mdx files found under ${DOCS_DIR}`);
    process.exit(1);
  }

  const results: MigrationResult[] = [];
  const failures: { path: string; error: Error }[] = [];

  for (const filename of filenames) {
    const fullPath = join(DOCS_DIR, filename);
    try {
      results.push(await migrateFile(fullPath));
    } catch (err) {
      failures.push({ path: fullPath, error: err as Error });
    }
  }

  const migrated = results.filter((r) => r.status === "migrated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  console.log(
    `Migrated ${migrated} files, skipped ${skipped} (already migrated).`
  );
  if (failures.length > 0) {
    console.error(`\nFailed (${failures.length}):`);
    for (const { path, error } of failures) {
      console.error(`  ${path}: ${error.message}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
