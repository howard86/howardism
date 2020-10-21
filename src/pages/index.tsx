import React, { FC } from "react";
import { GetStaticProps } from "next";
import matter from "gray-matter";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Box, Heading } from "rebass/styled-components";

import { MDX_SOURCE_PATH } from "@/constants/mdx";
import BlogPage, { BlogPageProps } from "@/components/blog/BlogPage";

const MAX_POSTS_PER_PAGE = 5;

export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  const postsMeta = readdirSync(MDX_SOURCE_PATH)
    .map((fileName) => {
      const content = readFileSync(join(MDX_SOURCE_PATH, fileName), "utf8");
      return matter(content).data as FrontMatter.Meta;
    })
    .sort((a, b) => (Date.parse(a.date) < Date.parse(b.date) ? 1 : -1))
    .slice(0, MAX_POSTS_PER_PAGE);
  return { props: { postsMeta } };
};

const Blog: FC<BlogPageProps> = ({ postsMeta }) => (
  <Box mx={[2, 3]}>
    <Heading mx={[2, 3]}>Howardism</Heading>
    <BlogPage postsMeta={postsMeta} />
  </Box>
);

export default Blog;
