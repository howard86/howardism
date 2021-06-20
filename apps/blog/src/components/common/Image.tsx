import { chakra, ImageProps as ChakraImageProps } from "@chakra-ui/react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import type { FC } from "react";

type ImageProps = NextImageProps & ChakraImageProps;

const Image: FC<ImageProps> = chakra(NextImage, {
  shouldForwardProp: (prop) => ["width", "height", "src", "alt"].includes(prop),
});

export default Image;
