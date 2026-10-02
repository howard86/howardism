import { parseArgs } from "node:util";
import {
  ContentBuildMarkerSchema,
  ContentLockSchema,
} from "@howardism/article-contract/manifests/content-release";
import { file } from "bun";
import { BLOG_ROOT } from "./paths";

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: { url: { type: "string" }, commit: { type: "string" } },
});
if (!(values.url && values.commit)) {
  throw new Error("Require --url and exact --commit before promotion");
}
const url = new URL(values.url);
if (url.protocol !== "https:") {
  throw new Error("Deployment verification requires HTTPS");
}
const response = await fetch(
  new URL("/.well-known/howardism-content.json", url),
  { cache: "no-store", signal: AbortSignal.timeout(30_000) }
);
if (!response.ok) {
  throw new Error(`Missing deployment marker (${response.status})`);
}
const marker = ContentBuildMarkerSchema.parse(await response.json());
const lock = ContentLockSchema.parse(
  await file(`${BLOG_ROOT}/content.lock.json`).json()
);
if (
  marker.applicationCommit !== values.commit ||
  marker.releaseSha256 !== lock.releaseSha256
) {
  throw new Error(
    "Deployment does not match approved application/content pair"
  );
}
process.stdout.write(
  `${JSON.stringify({ verified: true, deployment: url.origin, ...marker })}\n`
);
