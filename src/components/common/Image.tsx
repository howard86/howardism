import React, { FC } from "react";
import NextImage from "next/image";
import { Box, ImageProps as RebassImageProps } from "rebass/styled-components";

interface ImageProps extends RebassImageProps {
  src: string;
  width: number;
  height: number;
  alt: string;
  priority?: boolean;
}

const Image: FC<ImageProps> = ({ src, width, height, priority, alt, ...props }) => (
  <Box {...props}>
    <NextImage src={src} width={width} height={height} priority={priority} alt={alt} />
  </Box>
);

export default Image;
