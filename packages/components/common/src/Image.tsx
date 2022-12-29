import { chakra } from "@chakra-ui/react"
import NextImage, { ImageProps } from "next/image"

type ImagePropKey = keyof ImageProps | "layout"

const SKIPPED_PROPS: ImagePropKey[] = [
  "width",
  "height",
  "src",
  "alt",
  "layout",
  "quality",
  "placeholder",
  "priority",
  "objectFit",
  "objectPosition",
]

const Image = chakra(NextImage, {
  shouldForwardProp: (prop: ImagePropKey) => SKIPPED_PROPS.includes(prop),
})

export default Image
