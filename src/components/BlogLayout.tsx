import React, { FC } from "react";
import { Box } from "rebass";
import RouteLink from "./common/RouteLink";

const BlogLayout: FC = ({ children }) => {
  return (
    <Box mx={[3, 4, 5]}>
      <RouteLink href="/">Home</RouteLink>
      <Box>{children}</Box>
    </Box>
  );
};

export default BlogLayout;
