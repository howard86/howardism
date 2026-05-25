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
