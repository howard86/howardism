// Shared by next.config.ts and the generated Vercel image allowlist, so the
// custom loader only requests sizes Vercel will transform. Six widths and no
// imageSizes keep the variant count (and Hobby transforms) low.
export const imageDeviceSizes = [640, 750, 828, 1080, 1200, 1600];
export const imageSizes: number[] = [];
export const imageQualities = [75];
export const imageFormats = ["image/avif", "image/webp"] as const;
export const imageMinimumCacheTTL = 31_536_000;
