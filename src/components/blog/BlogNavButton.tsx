import React, { FC } from "react";
import { Box } from "rebass/styled-components";
import RouteLink from "@/components/common/RouteLink";

interface BlogNavButtonProps {
  title?: string;
  date?: string;
}

const BlogNavButton: FC<BlogNavButtonProps> = ({ title = "Back to Home", date }) => (
  <Box as="li">
    <RouteLink
      href={date ? `/blog/${date}` : "/"}
      sx={{
        "&:hover": {
          fontWeight: "bold",
        },
      }}
    >
      {title}
    </RouteLink>
  </Box>
);

export default BlogNavButton;
