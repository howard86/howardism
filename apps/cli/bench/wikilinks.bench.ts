// A4: extractLinkOccurrences re-segments every line through a multiline
// code-region regex, once for the slugs and once for the context.
import { extractLinkOccurrences } from "../src/import-wiki/wikilink.ts";
import { bench, checksum, log, readCorpus } from "./harness.ts";

// The committed MDX has its wikilinks already resolved to markdown, so it
// exercises only the empty path. Turning the internal links back into
// `[[slug|label]]` reconstructs the vault-shaped input the importer sees.
const ARTICLE_LINK_RE = /\[([^\]\n]+)\]\(\/articles\/([a-z0-9-]+)\)/g;

const corpus = readCorpus();
const vaultShaped = corpus.map((file) => ({
  slug: file.slug,
  text: file.text.replace(ARTICLE_LINK_RE, "[[$2|$1]]"),
}));

const resolved = bench("extractLinkOccurrences over corpus", () =>
  corpus.map((file) => extractLinkOccurrences(file.text))
);
const wikilinked = bench("extractLinkOccurrences over wikilinked corpus", () =>
  vaultShaped.map((file) => extractLinkOccurrences(file.text))
);

const count = (all: { slug: string }[][]): number =>
  all.reduce((sum, links) => sum + links.length, 0);
log(
  `  files ${corpus.length}  occurrences ${count(resolved)} / ${count(wikilinked)}  checksum ${checksum(resolved)} / ${checksum(wikilinked)}`
);
