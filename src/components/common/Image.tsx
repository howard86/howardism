import React, { FC } from "react";
import NextImage from "next/image";
import { Box, ImageProps as RebassImageProps } from "rebass/styled-components";

interface ImageProps extends RebassImageProps {
  src: string;
  width: number;
  height: number;
  priority?: boolean;
}

const Image: FC<ImageProps> = ({ src, width, height, priority, ...props }) => (
  <Box {...props}>
    <NextImage src={src} width={width} height={height} priority={priority} />
  </Box>
);

export default Image;
