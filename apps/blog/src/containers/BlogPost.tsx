import React, { FC } from "react";
import hydrate, { Source } from "next-mdx-remote/hydrate";
import { Box, Flex, Heading } from "@chakra-ui/react";

import BlogNavButton from "@/components/blog/BlogNavButton";

export interface BlogPostProps {
  mdxSource: Source;
  meta: FrontMatter.Meta;
}

const BlogPost: FC<BlogPostProps> = ({ mdxSource, meta }) => {
  const content = hydrate(mdxSource);
  return (
    <>
      <Flex as="ul" justify="space-between">
        <BlogNavButton title={meta.lastPostTitle} date={meta.lastPostDate} />
        <BlogNavButton title={meta.nextPostTitle} date={meta.nextPostDate} />
      </Flex>
      <Heading>{meta.title}</Heading>
      {content}
      <Box textAlign="center">
        <BlogNavButton />
      </Box>
    </>
  );
};

export default BlogPost;
