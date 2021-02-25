import React, { FC, memo } from "react";
import { Box, BoxProps } from "rebass/styled-components";
import styled from "styled-components";

const SvgBox: FC<BoxProps> = ({ children, ...props }) => (
  <Box as="svg" width="2em" mx="2" {...props}>
    {children}
  </Box>
);

const Svg = styled(SvgBox).attrs({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
})``;

export default memo(Svg);
