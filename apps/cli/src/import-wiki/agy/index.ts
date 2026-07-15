import { mkdir, rename, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

export interface GenerateImageOptions {
  body: string;
  dryRun?: boolean;
  outputPath: string;
  /** Custom shell runner — injected by tests. Defaults to `agy` via Bun.spawn. */
  runner?: (prompt: string) => Promise<{ stdout: string; stderr: string }>;
  stagingDir: string;
  title: string;
}

/**
 * Generate a hero image via the Antigravity (agy) CLI.
 *
 * Single session: read article body inline → compose visual prompt →
 * invoke `$imagegen` → write PNG into `stagingDir` (sandbox-writable). Then we
 * validate the PNG and rename it to `outputPath`, creating its parent dir if
 * needed.
 */
export async function generateHeroImage(
  options: GenerateImageOptions
): Promise<void> {
  const { title, body, outputPath, stagingDir, dryRun, runner } = options;
  const stagingPath = join(stagingDir, basename(outputPath));
  const prompt = buildPrompt({ title, body, outputPath: stagingPath });

  if (dryRun) {
    console.log(
      `[agy] DRY_RUN — would generate image for "${title}" → ${stagingPath} → ${outputPath}`
    );
    return;
  }

  await mkdir(stagingDir, { recursive: true });

  const exec = runner ?? defaultRunner;
  const { stdout, stderr } = await exec(prompt);

  if (stderr.trim()) {
    console.warn(`[agy] stderr for "${title}":\n${stderr}`);
  }
  if (stdout.trim()) {
    console.log(`[agy] stdout for "${title}":\n${stdout}`);
  }

  await assertValidPng(stagingPath, title);
  await mkdir(dirname(outputPath), { recursive: true });
  await rename(stagingPath, outputPath);
}

async function defaultRunner(
  prompt: string
): Promise<{ stdout: string; stderr: string }> {
  const proc = Bun.spawn(
    ["agy", "--dangerously-skip-permissions", "-p", prompt],
    {
      stdout: "pipe",
      stderr: "pipe",
    }
  );
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(
      `agy print failed (exit ${exitCode})\nstdout: ${stdout}\nstderr: ${stderr}`
    );
  }
  return { stdout, stderr };
}

export function buildPrompt(args: {
  title: string;
  body: string;
  outputPath: string;
}): string {
  const { title, body, outputPath } = args;
  const excerpt = body.slice(0, 1200);

  return [
    "You are generating a hero illustration for a blog article.",
    "",
    "Step 1 — Compose a single sentence describing an editorial illustration for the article below. Aim for a minimal composition, warm terracotta accent, paper-grain backdrop, no text in the image.",
    "",
    "Step 2 — Use the $imagegen skill with that sentence to render a 1600x900 PNG.",
    `Step 3 — Save the rendered PNG to: ${outputPath}`,
    "Step 4 — Print the absolute path of the saved file on its own line.",
    "",
    `Title: ${title}`,
    "",
    "Article excerpt:",
    excerpt,
  ].join("\n");
}

async function assertValidPng(path: string, label: string): Promise<void> {
  let info: Awaited<ReturnType<typeof stat>>;
  try {
    info = await stat(path);
  } catch {
    throw new Error(
      `agy did not produce ${path} for "${label}" — image generation failed`
    );
  }

  if (info.size === 0) {
    throw new Error(`Generated PNG is empty: ${path} (for "${label}")`);
  }

  const head = new Uint8Array(await Bun.file(path).slice(0, 4).arrayBuffer());
  if (!Buffer.from(head).equals(PNG_MAGIC)) {
    throw new Error(
      `Generated file is not a PNG (bad magic bytes): ${path} (for "${label}")`
    );
  }
}
