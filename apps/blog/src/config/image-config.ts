// next/image settings for server builds (`next dev`, unset DEPLOY_TARGET).
// Static exports set `unoptimized`, so these do not reach a deploy.
export const imageDeviceSizes = [640, 750, 828, 1080, 1200, 1600];
export const imageSizes: number[] = [];
export const imageQualities = [75];
export const imageFormats = ["image/avif", "image/webp"] as const;
export const imageMinimumCacheTTL = 31_536_000;
