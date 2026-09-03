// The article service's load path. Before the articles-meta manifest this
// module could not be imported outside the Next bundler at all — it globbed the
// content directory and dynamically imported all 427 compiled MDX modules — so
// there is no pre-manifest baseline to compare against here.
//
// The manifest parse and the entity table are built at module scope, so the
// import below is where that cost lands. Run this file on its own
// (`bun run bench articles-service`) for a truthful figure: another bench in
// the same process may already have imported the service.
import { plugin } from "bun";

import { bench, benchAsync, checksum, log } from "./harness";

// service.ts is a server module. Outside Next there is no `react-server`
// resolution condition, so importing `server-only` would throw.
plugin({
  name: "server-only-stub",
  setup(build) {
    build.module("server-only", () => ({ exports: {}, loader: "object" }));
  },
});

const importStarted = performance.now();
const service = await import("../src/app/(blog)/articles/service");
log(
  `${"module init (parse manifests, build table)".padEnd(48)} ${(performance.now() - importStarted).toFixed(2).padStart(13)} ms   n=1`
);

const firstStarted = performance.now();
const articles = await service.getArticles();
log(
  `${"getArticles() first call".padEnd(48)} ${(performance.now() - firstStarted).toFixed(2).padStart(13)} ms   n=1`
);
log(`  ids ${articles.ids.length}  checksum ${checksum(articles.ids)}`);

await benchAsync("getArticles() repeat call", () => service.getArticles(), 20);

const visible = await benchAsync("getVisibleArticles()", () =>
  service.getVisibleArticles()
);
log(`  ids ${visible.ids.length}  checksum ${checksum(visible.ids)}`);

const translated = service.getTranslatedSlugs();
const stale = bench(`isTranslationStale × ${translated.length}`, () =>
  translated.map((slug) => service.isTranslationStale(slug))
);
log(
  `  stale ${stale.filter(Boolean).length}/${stale.length}  checksum ${checksum(stale)}`
);
