import React, { FC } from "react";
import hydrate, { Source } from "next-mdx-remote/hydrate";
import { Center, Heading, List } from "@chakra-ui/react";

import BlogNavButton from "@/components/blog/BlogNavButton";

export interface BlogPostProps {
  mdxSource: Source;
  meta: FrontMatter.Meta;
}

const BlogPost: FC<BlogPostProps> = ({ mdxSource, meta }) => {
  const content = hydrate(mdxSource);
  return (
    <>
      <List display="flex" justifyContent="space-between">
        <BlogNavButton title={meta.lastPostTitle} date={meta.lastPostDate} />
        <BlogNavButton title={meta.nextPostTitle} date={meta.nextPostDate} />
      </List>
      <Heading as="h1">{meta.title}</Heading>
      {content}
      <Center>
        <BlogNavButton />
      </Center>
    </>
  );
};

export default BlogPost;
