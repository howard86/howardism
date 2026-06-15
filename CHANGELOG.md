# [v2.12.0](https://github.com/howard86/howardism/compare/v2.11.0...v2.12.0) (2026-06-15)

## ✨ New Features
- [`1ae28f7`](https://github.com/howard86/howardism/commit/1ae28f7)  feat(blog): unify width/gutter tokens and add plate taxonomy 
- [`d79e1d3`](https://github.com/howard86/howardism/commit/d79e1d3)  feat(blog): route every page through the PlatePage shell 
- [`ab005b4`](https://github.com/howard86/howardism/commit/ab005b4)  feat(blog): fold every article list onto one IndexRow 
- [`80513f7`](https://github.com/howard86/howardism/commit/80513f7)  feat(blog): specify the reading column once 
- [`2d6d5a0`](https://github.com/howard86/howardism/commit/2d6d5a0)  test(blog): guard the page frame against raw widths and gutters

# [v2.11.0](https://github.com/howard86/howardism/compare/v2.10.0...v2.11.0) (2026-06-14)

## ✨ New Features
- [`beb3682`](https://github.com/howard86/howardism/commit/beb3682)  feat(blog): add reading-store for browser-local reading history 
- [`abc46af`](https://github.com/howard86/howardism/commit/abc46af)  feat(blog): add shelf-rows builder resolving history to rows 
- [`0afeca6`](https://github.com/howard86/howardism/commit/0afeca6)  feat(blog): capture reads into Shelf history at the 25% threshold 
- [`2dac395`](https://github.com/howard86/howardism/commit/2dac395)  feat(blog): add /shelf reading-history page and nav entry 
- [`ebe95ec`](https://github.com/howard86/howardism/commit/ebe95ec)  feat(blog): add removeFromHistory to reading-store 
- [`4fb0cf0`](https://github.com/howard86/howardism/commit/4fb0cf0)  feat(blog): curate Shelf history with remove and tombstone rows 
- [`c160283`](https://github.com/howard86/howardism/commit/c160283)  feat(blog): add save-for-later API to reading-store 
- [`58f5110`](https://github.com/howard86/howardism/commit/58f5110)  feat(blog): add SaveButton and a Saved tab to the Shelf 
- [`fae379d`](https://github.com/howard86/howardism/commit/fae379d)  feat(blog): surface SaveButton on article and listing pages 
- [`748407b`](https://github.com/howard86/howardism/commit/748407b)  feat(blog): add clearReadingData to reading-store 
- [`35f6ca9`](https://github.com/howard86/howardism/commit/35f6ca9)  feat(blog): add Clear reading data control to the Tweaks panel 
- [`fed4fe5`](https://github.com/howard86/howardism/commit/fed4fe5)  feat(blog): add compare-ids resolver for the compare view 
- [`bc18737`](https://github.com/howard86/howardism/commit/bc18737)  feat(blog): add /compare route with bare-body columns and tabs 
- [`8b046df`](https://github.com/howard86/howardism/commit/8b046df)  feat(blog): add buildCompareHref for launching comparisons 
- [`6bc6700`](https://github.com/howard86/howardism/commit/6bc6700)  feat(blog): add cross-tab compare selection and launch bar to the Shelf

# [v2.10.0](https://github.com/howard86/howardism/compare/v2.9.1...v2.10.0) (2026-06-10)

## ✨ New Features
- [`3163a33`](https://github.com/howard86/howardism/commit/3163a33)  feat(blog): show reading progress in the resume chip

# [v2.9.1](https://github.com/howard86/howardism/compare/v2.9.0...v2.9.1) (2026-06-08)

## 🐛 Bug Fixes
- [`9920c73`](https://github.com/howard86/howardism/commit/9920c73)  fix(cli): resolve [[home]] links, stop flagging same-page anchors as unresolved

# [v2.9.0](https://github.com/howard86/howardism/compare/v2.8.0...v2.9.0) (2026-06-04)

## ✨ New Features
- [`14e84a3`](https://github.com/howard86/howardism/commit/14e84a3)  feat(article-contract): add manifest schemas for all five build-time JSON files

# [v2.8.0](https://github.com/howard86/howardism/compare/v2.7.0...v2.8.0) (2026-06-03)

## ✨ New Features
- [`ccb5ad6`](https://github.com/howard86/howardism/commit/ccb5ad6)  feat(ui): add Command and Dialog primitives for search palette 
- [`fe336da`](https://github.com/howard86/howardism/commit/fe336da)  feat(cli): add search-index builder and plain-text MDX extractor 
- [`5a76385`](https://github.com/howard86/howardism/commit/5a76385)  feat(blog): add site-wide search palette and find-in-article feature

# [v2.7.0](https://github.com/howard86/howardism/compare/v2.6.0...v2.7.0) (2026-05-30)

## ✨ New Features
- [`ab24543`](https://github.com/howard86/howardism/commit/ab24543)  feat(cli): migrate wiki importer from topics to domain MOC taxonomy 
- [`292c143`](https://github.com/howard86/howardism/commit/292c143)  feat(blog): migrate topic taxonomy to wiki domain MOCs + open-questions 
- [`0662c89`](https://github.com/howard86/howardism/commit/0662c89)  feat(cli): clean MOC titles and strip HTML comments on import 
- [`c7633a8`](https://github.com/howard86/howardism/commit/c7633a8)  feat(blog): render MOC inline on domain page + redirect old moc URLs 
- [`3fb7701`](https://github.com/howard86/howardism/commit/3fb7701)  feat(cli): add cursor translation engine with composer model

# [v2.6.0](https://github.com/howard86/howardism/compare/v2.5.1...v2.6.0) (2026-05-29)

## ✨ New Features
- [`2a2657b`](https://github.com/howard86/howardism/commit/2a2657b)  feat(blog): extend tweaks with text-size and tap-to-scroll settings 
- [`9e5c9a6`](https://github.com/howard86/howardism/commit/9e5c9a6)  feat(blog): add e-reader controls and article-nav context 
- [`ae59ccd`](https://github.com/howard86/howardism/commit/ae59ccd)  feat(ui): add ScrollArea primitive

# [v2.5.1](https://github.com/howard86/howardism/compare/v2.5.0...v2.5.1) (2026-05-29)

# [v2.5.0](https://github.com/howard86/howardism/compare/v2.4.0...v2.5.0) (2026-05-29)

## ✨ New Features
- [`52ab7ab`](https://github.com/howard86/howardism/commit/52ab7ab)  feat(cli): add --warn flag to translate --check for annotation-only mode 

## 🐛 Bug Fixes
- [`e42bb7e`](https://github.com/howard86/howardism/commit/e42bb7e)  fix(cli): drop non-string date fields in normaliseFrontmatter

# [v2.4.0](https://github.com/howard86/howardism/compare/v2.3.8...v2.4.0) (2026-05-25)

## ✨ New Features
- [`3daaedd`](https://github.com/howard86/howardism/commit/3daaedd)  feat(cli): add do-not-translate glossary for translations 
- [`8a36983`](https://github.com/howard86/howardism/commit/8a36983)  feat(cli): add pluggable translation engines 
- [`35ca9bd`](https://github.com/howard86/howardism/commit/35ca9bd)  feat(cli): add translation prompt builder and output validation 
- [`7f1382c`](https://github.com/howard86/howardism/commit/7f1382c)  feat(cli): add translate orchestrator and npm scripts 
- [`c7024da`](https://github.com/howard86/howardism/commit/c7024da)  feat(cli): add SQLite-backed glossary store with CLI and MCP server 
- [`a94af0b`](https://github.com/howard86/howardism/commit/a94af0b)  feat(cli): normalize translated section headings to canonical zh-TW 
- [`73e2ac4`](https://github.com/howard86/howardism/commit/73e2ac4)  feat(cli): capture engine cost/usage telemetry 
- [`07b291d`](https://github.com/howard86/howardism/commit/07b291d)  feat(cli): track translation freshness and project run history 
- [`13f63a7`](https://github.com/howard86/howardism/commit/13f63a7)  feat(blog): add zh-TW article translations and tracking projection 
- [`56fd22b`](https://github.com/howard86/howardism/commit/56fd22b)  feat(blog): on-demand locale-aware article rendering (zh-TW) 
- [`0b1197a`](https://github.com/howard86/howardism/commit/0b1197a)  feat(cli): stream engine stderr live with slug prefix 
- [`77d3909`](https://github.com/howard86/howardism/commit/77d3909)  feat(cli): add --limit flag and per-attempt heartbeat logging to translate CLI 
- [`59c81fb`](https://github.com/howard86/howardism/commit/59c81fb)  feat(cli): pass --model auto to kiro engine for faster processing 
- [`07b9de4`](https://github.com/howard86/howardism/commit/07b9de4)  feat(translate): stale-skip guard and staleness badge 
- [`2d5e37f`](https://github.com/howard86/howardism/commit/2d5e37f)  feat(blog): add zh-TW translations for all 89 articles 
- [`c358276`](https://github.com/howard86/howardism/commit/c358276)  feat(translate): add deterministic MDX escaping post-processor 

## 🐛 Bug Fixes
- [`98f44fd`](https://github.com/howard86/howardism/commit/98f44fd)  fix(cli): harden glossary concurrency and batch term registration 
- [`7a10a43`](https://github.com/howard86/howardism/commit/7a10a43)  fix(cli): restore existing translation when all engine attempts fail 
- [`1af585c`](https://github.com/howard86/howardism/commit/1af585c)  fix(blog): convert missing zh-TW MDX import errors to 404 
- [`1a10fb5`](https://github.com/howard86/howardism/commit/1a10fb5)  fix(cli): guard backup restore writeFile with try-catch 
- [`00dd75e`](https://github.com/howard86/howardism/commit/00dd75e)  fix(blog): escape MDX-breaking characters in zh-TW translated articles

# [v2.3.8](https://github.com/howard86/howardism/compare/v2.3.7...v2.3.8) (2026-05-23)

## 🐛 Bug Fixes
- [`365ea17`](https://github.com/howard86/howardism/commit/365ea17)  fix(cli): stop double-escaping LaTeX braces in MDX import

# [v2.3.7](https://github.com/howard86/howardism/compare/v2.3.6...v2.3.7) (2026-05-23)

## 🐛 Bug Fixes
- [`a89fc62`](https://github.com/howard86/howardism/commit/a89fc62)  fix(blog): hide ArticleToc for single-heading articles (#775) (Issues: [`#775`](https://github.com/howard86/howardism/issues/775))

# [v2.3.6](https://github.com/howard86/howardism/compare/v2.3.5...v2.3.6) (2026-05-23)

## 🐛 Bug Fixes
- [`d619f7d`](https://github.com/howard86/howardism/commit/d619f7d)  fix(blog): strip backtick code spans from getHeadings text (#776) (Issues: [`#776`](https://github.com/howard86/howardism/issues/776))

# [v2.3.5](https://github.com/howard86/howardism/compare/v2.3.4...v2.3.5) (2026-05-23)

## 🐛 Bug Fixes
- [`29763ff`](https://github.com/howard86/howardism/commit/29763ff)  fix(blog): close useScrollSpy TOC dead zone at tall viewports (#772) (Issues: [`#772`](https://github.com/howard86/howardism/issues/772))
- [`06a9084`](https://github.com/howard86/howardism/commit/06a9084)  fix(blog): strip markdown link syntax from getHeadings slugs (#773) (Issues: [`#773`](https://github.com/howard86/howardism/issues/773))

# [v2.3.4](https://github.com/howard86/howardism/compare/v2.3.3...v2.3.4) (2026-05-23)

## 🐛 Bug Fixes
- [`24b0ce1`](https://github.com/howard86/howardism/commit/24b0ce1)  fix(cli): escape &lt; unconditionally in wiki prose (#762) (Issues: [`#762`](https://github.com/howard86/howardism/issues/762))

# [v2.3.3](https://github.com/howard86/howardism/compare/v2.3.2...v2.3.3) (2026-05-22)

## 🐛 Bug Fixes
- [`4fa00f0`](https://github.com/howard86/howardism/commit/4fa00f0)  fix(cli): emit date-only generatedOn for deterministic manifests
