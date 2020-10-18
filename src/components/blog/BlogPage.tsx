import React, { FC } from "react";
import { Box } from "rebass/styled-components";
import PostCard from "./PostCard";

export interface BlogPageProps {
  postsMeta: FrontMatter.Meta[];
}

// TODO: add tags for future utilities
const BlogPage: FC<BlogPageProps> = ({ postsMeta }) => (
  <Box as="ul">
    {postsMeta.map((meta) => (
      <Box key={meta.date} as="li">
        <PostCard title={meta.title} description={meta.description} date={meta.date} tags={[]} />
      </Box>
    ))}
  </Box>
);

export default BlogPage;
