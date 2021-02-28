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
    </>
  );
};

export default BlogPost;
