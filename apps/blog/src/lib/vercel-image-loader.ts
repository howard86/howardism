import type { ImageLoaderProps } from "next/image";

export default function vercelImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality ?? 75}`;
}
