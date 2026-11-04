import { afterAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

import {
  ensureHeroVariants,
  rewriteHeroImportToWebp,
  writeHeroVariants,
} from "../webp.ts";

const hero = (file: string) =>
  `---\ntitle: X\n---\nexport { default as heroImage } from "../assets/${file}";\n\nBody.\n`;

describe("rewriteHeroImportToWebp", () => {
  it("swaps the hero import extension and leaves the rest byte-identical", () => {
    expect(rewriteHeroImportToWebp(hero("the-bitter-lesson.png"))).toBe(
      hero("the-bitter-lesson.webp")
    );
  });

  it("is a no-op on an already-migrated article", () => {
    const raw = hero("a.webp");
    expect(rewriteHeroImportToWebp(raw)).toBe(raw);
  });

  it("leaves MDX with no hero import untouched", () => {
    const raw = "---\ntitle: X\n---\n\nBody with a /y.png link.\n";
    expect(rewriteHeroImportToWebp(raw)).toBe(raw);
  });

  it("does not touch PNG references outside the hero import line", () => {
    const raw = `${hero("a.png")}\n![alt](/diagram.png)\n`;
    expect(rewriteHeroImportToWebp(raw)).toContain("![alt](/diagram.png)");
  });
});

describe("hero variants", () => {
  const dirs: string[] = [];
  afterAll(async () => {
    await Promise.all(
      dirs.map((dir) => rm(dir, { recursive: true, force: true }))
    );
  });

  async function heroIn(width = 1600): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), "hero-variants-"));
    dirs.push(dir);
    const path = join(dir, "a.webp");
    await sharp({
      create: { width, height: 900, channels: 3, background: "#c96" },
    })
      .webp()
      .toFile(path);
    return path;
  }

  it("writes one downscaled twin per width beside the hero", async () => {
    const heroPath = await heroIn();
    const written = await writeHeroVariants(heroPath, heroPath);
    expect(written.map((p) => p.slice(p.lastIndexOf("/") + 1))).toEqual([
      "a-800.webp",
      "a-1200.webp",
    ]);
    const widths = await Promise.all(
      written.map(async (p) => (await sharp(p).metadata()).width)
    );
    expect(widths).toEqual([800, 1200]);
  });

  it("never upscales a hero narrower than a variant width", async () => {
    const heroPath = await heroIn(1000);
    const [, wide] = await writeHeroVariants(heroPath, heroPath);
    expect((await sharp(wide).metadata()).width).toBe(1000);
  });

  it("backfills only when a variant is missing", async () => {
    const heroPath = await heroIn();
    expect(await ensureHeroVariants(heroPath)).toBe(true);
    expect(await ensureHeroVariants(heroPath)).toBe(false);
  });
});
