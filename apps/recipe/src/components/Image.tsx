import NextImage, { ImageProps } from "next/image";
import { chakra } from "@chakra-ui/react";

type ImagePropKey = keyof ImageProps | "layout";

const SKIPPED_PROPS: ImagePropKey[] = ["width", "height", "src", "alt", "layout"];

const Image = chakra(NextImage, {
  shouldForwardProp: (prop: ImagePropKey) => SKIPPED_PROPS.includes(prop),
});

export default Image;
