// The whole-corpus derivations the article routes ask for. React's `cache()` is
// a no-op outside a render pass, so a repeated call here costs what it costs a
// fresh request in production — which is what every article page is.
import { plugin } from "bun";

import { benchAsync, checksum, log } from "./harness";

// See articles-service.bench.ts: no `react-server` condition outside Next.
plugin({
  name: "server-only-stub",
  setup(build) {
    build.module("server-only", () => ({ exports: {}, loader: "object" }));
  },
});

const service = await import("../src/app/(blog)/articles/service");
const slugs = (await service.getArticles()).ids;
const navigable = await service.getNavigableTags();
const domains = service.ARTICLE_DOMAINS;

const REPEATS = 100;
const INDEX_REPEATS = 20;

const siblings = await benchAsync(`getSiblings × ${slugs.length}`, async () => {
  const out: Awaited<ReturnType<typeof service.getSiblings>>[] = [];
  for (const slug of slugs) {
    out.push(await service.getSiblings(slug));
  }
  return out;
});
log(`  checksum ${checksum(siblings)}`);

const tagged = await benchAsync(
  `getTaggedArticles × ${navigable.length}`,
  async () => {
    const out: string[][] = [];
    for (const tag of navigable) {
      out.push((await service.getTaggedArticles(tag)).map((a) => a.slug));
    }
    return out;
  }
);
log(`  checksum ${checksum(tagged)}`);

const byDomain = await benchAsync(
  `getArticlesByDomain × ${domains.length}`,
  async () => {
    const out: string[][] = [];
    for (const domain of domains) {
      out.push((await service.getArticlesByDomain(domain)).map((a) => a.slug));
    }
    return out;
  }
);
log(`  checksum ${checksum(byDomain)}`);

await benchAsync(`getNavigableTagSet × ${REPEATS}`, async () => {
  let last: ReadonlySet<string> | undefined;
  for (let i = 0; i < REPEATS; i++) {
    last = await service.getNavigableTagSet();
  }
  return last;
});
log(`  checksum ${checksum([...(await service.getNavigableTagSet())])}`);

await benchAsync(`getTagIndex × ${INDEX_REPEATS}`, async () => {
  let last: Awaited<ReturnType<typeof service.getTagIndex>> | undefined;
  for (let i = 0; i < INDEX_REPEATS; i++) {
    last = await service.getTagIndex();
  }
  return last;
});
log(`  checksum ${checksum(await service.getTagIndex())}`);

await benchAsync(`getDomainSparklines × ${INDEX_REPEATS}`, async () => {
  let last: Awaited<ReturnType<typeof service.getDomainSparklines>> | undefined;
  for (let i = 0; i < INDEX_REPEATS; i++) {
    last = await service.getDomainSparklines();
  }
  return last;
});
log(`  checksum ${checksum(await service.getDomainSparklines())}`);

const counts = await benchAsync("getDomainCounts()", () =>
  service.getDomainCounts()
);
log(`  checksum ${checksum(counts)}`);

const tagCounts = await benchAsync("getTagCounts()", () =>
  service.getTagCounts()
);
log(`  checksum ${checksum(tagCounts)}`);

const questions = await benchAsync(
  `getOpenQuestionsByDomain × ${domains.length}`,
  () =>
    Promise.resolve(
      domains.map((domain) =>
        service.getOpenQuestionsByDomain(domain).map((c) => c.slug)
      )
    )
);
log(`  checksum ${checksum(questions)}`);

const translated = await benchAsync("getTranslatedSlugs()", () =>
  Promise.resolve(service.getTranslatedSlugs())
);
log(`  checksum ${checksum(translated)}`);
