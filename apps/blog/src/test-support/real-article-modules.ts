import { ArticleRail as RealArticleRail } from "@/app/(blog)/articles/[slug]/article-rail";

// Value copy of the genuine ArticleRail, captured the moment this module is
// evaluated. The test preload imports this file, so the capture happens before
// article-layout.test registers its process-wide `mock.module(..., () => null)`
// stub. Re-exporting with `export { ArticleRail } from ...` would NOT work: that
// is an indirect binding that follows mock.module's later registry swap to the
// stub. Binding the value to a const freezes the real implementation so the
// dedicated article-rail suite gets it regardless of test-file order (see #780).
export const ArticleRail = RealArticleRail;
