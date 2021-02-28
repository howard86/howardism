import type { FC } from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import { ImageProps as ChakraImageProps, chakra } from "@chakra-ui/react";

type ImageProps = NextImageProps & ChakraImageProps;

const Image: FC<ImageProps> = chakra(NextImage, {
  shouldForwardProp: (prop) => ["width", "height", "src", "alt"].includes(prop),
});

export default Image;
