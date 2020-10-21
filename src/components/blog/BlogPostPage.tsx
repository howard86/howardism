import React, { FC } from "react";
import hydrate, { Source } from "next-mdx-remote/hydrate";
import { Box, Flex, Heading } from "rebass/styled-components";

import BlogNavButton from "./BlogNavButton";

export interface BlogPostPageProps {
  mdxSource: Source;
  meta: FrontMatter.Meta;
}

const BlogPostPage: FC<BlogPostPageProps> = ({ mdxSource, meta }) => {
  const content = hydrate(mdxSource);
  return (
    <Box mx={[3, 4, 5]}>
      <Flex as="ul" justifyContent="space-between">
        <BlogNavButton title={meta.lastPostTitle} date={meta.lastPostDate} />
        <BlogNavButton title={meta.nextPostTitle} date={meta.nextPostDate} />
      </Flex>
      <Heading fontSize={[3, 4, 5]} mt={[3, 4, 5]}>
        {meta.title}
      </Heading>
      {content}
      <Box my={[2, 3, 4]} sx={{ textAlign: "center" }}>
        <BlogNavButton />
      </Box>
    </Box>
  );
};

export default BlogPostPage;
