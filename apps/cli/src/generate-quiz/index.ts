import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { WikiDomain } from "@howardism/article-contract";
import {
  QuizCardSchema,
  type QuizConcept,
  type QuizManifest,
  QuizManifestSchema,
  QuizMcqSchema,
} from "@howardism/article-contract/manifests/quiz";
import matter from "gray-matter";
import { z } from "zod";

import { runWithConcurrency } from "../concurrency.ts";
import { parseEngine, runEngine } from "../translate/engines.ts";
import { type MocConcept, parseMocConcepts } from "./parse-moc.ts";
import { buildQuizPrompt } from "./prompt.ts";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const ARTICLES_DIR = join(REPO_ROOT, "apps/blog/src/content/articles");
const QUIZ_PATH = join(REPO_ROOT, "apps/blog/src/data/quiz.json");

/** The engine returns just `{ mcq, cards }`; metadata is stamped on by us. */
const GeneratedQuizSchema = z.object({
  cards: z.array(QuizCardSchema),
  mcq: z.array(QuizMcqSchema),
});

const FENCE_RE = /^```(?:json)?\s*|\s*```$/g;

interface Options {
  cardCount: number;
  concurrency: number;
  domains: WikiDomain[];
  dryRun: boolean;
  engine: string;
  force: boolean;
  limit: number | null;
  mcqCount: number;
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const domainArg = get("--domain") ?? "ai-engineering";
  const limitRaw = get("--limit");
  return {
    domains: domainArg.split(",").map((d) => d.trim()) as WikiDomain[],
    engine: process.env.QUIZ_ENGINE ?? process.env.TRANSLATE_ENGINE ?? "claude",
    concurrency: Number(get("--concurrency") ?? 3),
    mcqCount: Number(get("--mcq") ?? 3),
    cardCount: Number(get("--cards") ?? 2),
    limit: limitRaw ? Number(limitRaw) : null,
    force: argv.includes("--force"),
    dryRun: argv.includes("--dry-run"),
  };
}

async function readExistingManifest(): Promise<QuizManifest> {
  try {
    const raw = await readFile(QUIZ_PATH, "utf8");
    return QuizManifestSchema.parse(JSON.parse(raw));
  } catch {
    return { generatedOn: "", concepts: [] };
  }
}

async function readArticleBody(slug: string): Promise<string> {
  const raw = await readFile(join(ARTICLES_DIR, `${slug}.mdx`), "utf8");
  return matter(raw).content.trim();
}

async function generateOne(args: {
  concept: MocConcept;
  domain: WikiDomain;
  opts: Options;
  stagingDir: string;
}): Promise<QuizConcept | null> {
  const { concept, domain, opts, stagingDir } = args;
  const outputPath = join(stagingDir, `${concept.slug}.json`);
  let articleBody: string;
  try {
    articleBody = await readArticleBody(concept.slug);
  } catch {
    console.warn(`[generate-quiz] skip ${concept.slug} (no article file)`);
    return null;
  }
  const prompt = buildQuizPrompt({
    title: concept.title,
    articleBody,
    outputPath,
    mcqCount: opts.mcqCount,
    cardCount: opts.cardCount,
  });
  try {
    await runEngine(parseEngine(opts.engine), {
      prompt,
      scopeDir: REPO_ROOT,
      timeoutMs: 300_000,
    });
    const written = (await readFile(outputPath, "utf8")).replace(FENCE_RE, "");
    const generated = GeneratedQuizSchema.parse(JSON.parse(written));
    console.log(
      `[generate-quiz] ok ${concept.slug} (${generated.mcq.length} mcq)`
    );
    return {
      slug: concept.slug,
      title: concept.title,
      domain,
      isHub: concept.isHub,
      mcq: generated.mcq,
      cards: generated.cards,
    };
  } catch (error) {
    console.warn(`[generate-quiz] fail ${concept.slug}: ${String(error)}`);
    return null;
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  console.log("[generate-quiz] options:", opts);

  const existing = await readExistingManifest();
  const existingBySlug = new Map(existing.concepts.map((c) => [c.slug, c]));

  const targets: { concept: MocConcept; domain: WikiDomain }[] = [];
  for (const domain of opts.domains) {
    const mocPath = join(ARTICLES_DIR, `moc-${domain}.mdx`);
    let mocBody: string;
    try {
      mocBody = matter(await readFile(mocPath, "utf8")).content;
    } catch {
      console.warn(`[generate-quiz] no MOC for domain "${domain}"; skipping`);
      continue;
    }
    for (const concept of parseMocConcepts(mocBody)) {
      if (!opts.force && existingBySlug.has(concept.slug)) {
        continue;
      }
      targets.push({ concept, domain });
    }
  }

  const queued = opts.limit ? targets.slice(0, opts.limit) : targets;
  console.log(
    `[generate-quiz] ${queued.length} concept(s) to generate (${existing.concepts.length} already present)`
  );
  if (opts.dryRun) {
    for (const { concept, domain } of queued) {
      console.log(`[generate-quiz] would generate ${domain}/${concept.slug}`);
    }
    return;
  }
  if (queued.length === 0) {
    return;
  }

  const stagingDir = await mkdtemp(join(tmpdir(), "quiz-gen-"));
  let generated: (QuizConcept | null)[];
  try {
    generated = await runWithConcurrency(queued, opts.concurrency, (target) =>
      generateOne({ ...target, opts, stagingDir })
    );
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }

  // Keep every concept we already had (unless --force regenerated it), then add
  // the freshly generated ones, and sort by domain + title for a stable diff.
  const merged = new Map(existingBySlug);
  for (const concept of generated) {
    if (concept) {
      merged.set(concept.slug, concept);
    }
  }
  const concepts = [...merged.values()].sort(
    (a, b) => a.domain.localeCompare(b.domain) || a.title.localeCompare(b.title)
  );

  const manifest: QuizManifest = {
    generatedOn: new Date().toISOString().slice(0, 10),
    concepts,
  };
  QuizManifestSchema.parse(manifest);
  await mkdir(join(REPO_ROOT, "apps/blog/src/data"), { recursive: true });
  await writeFile(QUIZ_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `[generate-quiz] wrote ${concepts.length} concept(s) to ${QUIZ_PATH}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
