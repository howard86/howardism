/**
 * Translates the messages/en.json UI strings to messages/zh-TW.json using the
 * same engine infrastructure as article translation. Preserves ICU message
 * format placeholders ({variable}) and JSON structure.
 *
 * Usage: bun src/translate/messages.ts [--dry-run] [--engine kiro|bedrock]
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { type Engine, parseEngine, runEngine } from "./engines.ts";

const HERE = dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = resolve(HERE, "../../../..");
const EN_PATH = resolve(REPO_ROOT, "apps/blog/messages/en.json");
const ZH_PATH = resolve(REPO_ROOT, "apps/blog/messages/zh-TW.json");

interface FlatEntry {
  key: string;
  value: string;
}

function flatten(obj: Record<string, unknown>, prefix = ""): FlatEntry[] {
  const entries: FlatEntry[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      entries.push({ key: path, value: v });
    } else if (typeof v === "object" && v !== null) {
      entries.push(...flatten(v as Record<string, unknown>, path));
    }
  }
  return entries;
}

function unflatten(entries: FlatEntry[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { key, value } of entries) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts.at(-1) as string] = value;
  }
  return result;
}

function buildPrompt(entries: FlatEntry[]): string {
  const lines = entries.map((e) => `${e.key} = ${e.value}`);
  return [
    "Translate the following UI strings from English to Traditional Chinese (zh-TW).",
    "Rules:",
    "- Preserve all ICU placeholders like {variable} exactly as-is",
    "- Preserve the key = value format exactly",
    "- Keep brand names (Howardism, Howard Tai) unchanged",
    "- Keep technical terms in English where appropriate (RSS, AI, MDX)",
    "- Output ONLY the translated key = value lines, nothing else",
    "",
    ...lines,
  ].join("\n");
}

function parseResponse(response: string, keys: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of response.split("\n")) {
    const eqIdx = line.indexOf(" = ");
    if (eqIdx < 0) {
      continue;
    }
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 3).trim();
    if (keys.includes(key)) {
      map.set(key, value);
    }
  }
  return map;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const engineArg = args.find((a) => a.startsWith("--engine="))?.split("=")[1];
  const engine: Engine = engineArg ? parseEngine(engineArg) : "kiro";

  const enRaw = await readFile(EN_PATH, "utf8");
  const enJson = JSON.parse(enRaw) as Record<string, unknown>;
  const entries = flatten(enJson);

  const hash = createHash("sha256").update(enRaw).digest("hex").slice(0, 12);
  console.log(
    `[translate-messages] ${entries.length} strings, source hash: ${hash}`
  );

  if (dryRun) {
    console.log("[translate-messages] dry-run — would translate:");
    for (const e of entries) {
      console.log(`  ${e.key}: ${e.value}`);
    }
    return;
  }

  const prompt = buildPrompt(entries);
  console.log(`[translate-messages] translating with engine=${engine}...`);

  const result = await runEngine(engine, prompt, {
    kiroClient: undefined,
    modelLabel: null,
    timeoutMs: 120_000,
  });

  const translated = parseResponse(
    result.text,
    entries.map((e) => e.key)
  );
  console.log(
    `[translate-messages] got ${translated.size}/${entries.length} translations`
  );

  // Merge: use translated value if available, keep original otherwise
  const merged = entries.map((e) => ({
    key: e.key,
    value: translated.get(e.key) ?? e.value,
  }));

  const output = `${JSON.stringify(unflatten(merged), null, 2)}\n`;
  await writeFile(ZH_PATH, output);
  console.log(`[translate-messages] wrote ${ZH_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
