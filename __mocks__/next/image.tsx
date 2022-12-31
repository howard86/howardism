import { ImageProps } from "next/image"

export default function ImageMock({ alt }: ImageProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} />
}
