// Keep these in sync with Next 16's defaults and the generated Vercel image
// allowlist. Explicit values ensure the custom loader only requests allowed sizes.
export const imageDeviceSizes = [640, 750, 828, 1080, 1200, 1920, 2048, 3840];
export const imageSizes = [32, 48, 64, 96, 128, 256, 384];
export const imageQualities = [75];
export const imageFormats = ["image/avif", "image/webp"] as const;
export const imageMinimumCacheTTL = 2_678_400;
