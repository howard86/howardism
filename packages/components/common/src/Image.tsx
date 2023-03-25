import { chakra } from "@chakra-ui/react"
import NextImage, { ImageProps } from "next/image"

type ImagePropKey = keyof ImageProps

const SKIPPED_PROPS: ImagePropKey[] = [
  "width",
  "height",
  "src",
  "alt",
  "quality",
  "placeholder",
  "priority",
]

const Image = chakra(NextImage, {
  shouldForwardProp: (prop: ImagePropKey) => SKIPPED_PROPS.includes(prop),
})

export default Image
