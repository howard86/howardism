# CONTEXT

Domain and architecture vocabulary for this monorepo. Add terms here as they
crystallize; keep one definition per concept so reviews and agents share language.

## Manifest

A build-time JSON artifact the **CLI produces** and the **blog consumes** — the
seam between the two apps. The five manifests live in `apps/blog/src/data/`:

| Manifest | Produced by | Read by |
|---|---|---|
| `article-graph.json` | `import-wiki/pages/graph.ts` | `articles/service.ts` (build) |
| `wiki-sources.json` | `import-wiki/pages/wiki-sources.ts` | `articles/service.ts` (build) |
| `open-questions.json` | `import-wiki/pages/open-questions.ts` | `articles/service.ts` (build) |
| `search-index.json` | `search-index.ts` | `components/search/search-data.ts` (browser) |
| `translations.json` | `translate/tracking/projection.ts` | `articles/service.ts` (build) |

### The contract rule

Every manifest's **shape is owned once**, by `@howardism/article-contract` under
`src/manifests/<name>.ts` — a zod schema, its inferred type, and (for
build-time readers) a `parse*` function. Producer and consumer import the same
shape; neither re-declares it. This is what makes the manifest a real **seam**
rather than two interfaces that happen to agree.

### Write-gate vs read-parse

- **Write-gate** — the CLI runs `Schema.parse(...)` immediately before writing
  every manifest, so a malformed manifest can never land on disk. All five are
  gated on write.
- **Read-parse** — the four manifests read at **build time** in `service.ts` are
  re-validated via their `parse*` function on read, so a stale committed file
  throws a named error at build instead of failing silently.
- **Search-index carve-out** — `search-index.json` (~800 KB) is read in the
  **visitor's browser** when the search palette opens. It shares the inferred
  type and is gated on write, but is **not** zod-parsed on read — the browser
  pays no validation cost. Its `domain`/`tag` fields stay loose `string` (not the
  `WikiDomain`/`WikiTag` enums) so a new domain can land before an enum bump.

## article-contract

The shared package (`packages/article-contract`) that owns every cross-app shape:
the MDX **frontmatter** contract (`./schema`), the translation **surface** hash
(`./surface`), and the five **manifest** contracts (`./manifests/*`). Builders'
algorithms stay in the CLI; only the interface lives here.
