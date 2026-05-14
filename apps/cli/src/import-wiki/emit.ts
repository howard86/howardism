import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type WikiTag = "Concept" | "Entity" | "Essay" | "Index" | "Changelog";

export const WIKI_TAGS: readonly WikiTag[] = [
  "Concept",
  "Entity",
  "Essay",
  "Index",
  "Changelog",
];

export interface ArticleMeta {
  date: string;
  description: string;
  readingTime: number;
  tag: WikiTag;
  title: string;
}

export interface EmitArticleArgs {
  articleDir: string;
  body: string;
  dryRun?: boolean;
  imageAlt: string;
  imageFile: string;
  meta: ArticleMeta;
}

const MDX_FILENAME = "page.mdx";

export async function emitArticle(args: EmitArticleArgs): Promise<string> {
  const { articleDir, imageFile, imageAlt, meta, body, dryRun } = args;
  const filePath = join(articleDir, MDX_FILENAME);

  // We intentionally do NOT emit `import Link from "next/link";` even when
  // the body contains `<Link>` JSX — the blog's `mdx-components.tsx`
  // provides a `Link` override that adds hover-card previews for internal
  // articles. A local import would shadow that override (MDX resolves
  // capitalised JSX against in-scope bindings before the components map).
  const imports: string[] = [
    'import Image from "@/components/mdx-image";',
    `import heroImage from "../(assets)/${imageFile}";`,
  ];

  const metaLines = [
    "export const meta = {",
    `  date: ${JSON.stringify(meta.date)},`,
    `  title: ${JSON.stringify(meta.title)},`,
    `  description: ${JSON.stringify(meta.description)},`,
    `  image: { src: heroImage, alt: ${JSON.stringify(imageAlt)} },`,
    `  readingTime: ${meta.readingTime},`,
    `  tag: ${JSON.stringify(meta.tag)},`,
    "};",
  ];

  const fileContent = [
    imports.join("\n"),
    "",
    metaLines.join("\n"),
    "",
    '<Image placeholder="blur" {...meta.image} />',
    "",
    body.trimEnd(),
    "",
  ].join("\n");

  if (dryRun) {
    console.log(`[emit] DRY_RUN — would write ${filePath}`);
    return filePath;
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, fileContent, "utf8");
  return filePath;
}
