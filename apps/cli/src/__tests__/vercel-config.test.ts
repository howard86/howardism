import { expect, it } from "bun:test";
import { BLOG_ROOT } from "../content/paths";
import { generateVercelConfig } from "../vercel-config/config";

it("keeps the committed Vercel config generated from blog settings", async () => {
  expect(JSON.parse(await Bun.file(`${BLOG_ROOT}/vercel.json`).text())).toEqual(
    JSON.parse(JSON.stringify(generateVercelConfig()))
  );
});
