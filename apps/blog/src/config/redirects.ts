export interface RedirectRule {
  destination: string;
  permanent: boolean;
  source: string;
}

export const redirects: RedirectRule[] = [
  { source: "/photos", destination: "/", permanent: true },
  { source: "/about", destination: "/", permanent: true },
  { source: "/thank-you", destination: "/", permanent: true },
  // The synthesized `/articles/wiki` landing page was retired once
  // `/articles` itself became the dense tag-grouped index. Keep the URL
  // alive as a permanent (308) redirect so any external links and the
  // pre-rename graph references still land on the canonical index.
  { source: "/articles/wiki", destination: "/articles", permanent: true },
  {
    source: "/articles/wiki-changelog",
    destination: "/articles",
    permanent: true,
  },
  {
    source: "/articles/tag/changelog",
    destination: "/articles",
    permanent: true,
  },
  // The five derived `topic` buckets were replaced by the wiki's nine
  // curated `domain` MOCs. The taxonomies don't map 1:1, so old topic URLs
  // land on the articles index rather than guessing a domain.
  {
    source: "/articles/topic/:slug",
    destination: "/articles",
    permanent: true,
  },
  // Each domain's `moc-<domain>` Map of Content is now rendered inline on the
  // domain page rather than as a standalone article. Its old article URL folds
  // into the canonical domain page so wiki backlinks to the MOC keep resolving.
  {
    source: "/articles/moc-:domain",
    destination: "/articles/domain/:domain",
    permanent: true,
  },
  // `syntheses` stopped being a browsable domain once the vault restructure
  // filed every derived essay under a real domain (2026-08-18) — it now
  // holds only the two generated index pages, too thin to be its own page.
  {
    source: "/articles/domain/syntheses",
    destination: "/articles",
    permanent: true,
  },
  {
    source: "/zh-TW/articles/wiki-changelog",
    destination: "/zh-TW/articles",
    permanent: true,
  },
];
