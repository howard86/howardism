import { Heading, List, ListItem } from "@chakra-ui/react";
import fs from "fs";
import matter from "gray-matter";
import type { GetStaticProps, NextPage } from "next";
import path from "path";
import React from "react";

import PostCard from "@/components/blog/PostCard";
import { MDX_SOURCE_PATH } from "@/constants/mdx";

const MAX_POSTS_PER_PAGE = 5;

interface HomeProps {
  postsMeta: FrontMatter.Meta[];
}

const Home: NextPage<HomeProps> = ({ postsMeta }) => (
  <>
    <Heading as="h1" mx="5">
      Howardism
    </Heading>
    <List my="2">
      {postsMeta.map((meta) => (
        <ListItem key={meta.date}>
          <PostCard title={meta.title} description={meta.description} date={meta.date} tags={[]} />
        </ListItem>
      ))}
    </List>
  </>
);

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const postsMeta = fs
    .readdirSync(MDX_SOURCE_PATH)
    .map((fileName) => {
      const content = fs.readFileSync(path.join(MDX_SOURCE_PATH, fileName), "utf8");
      return matter(content).data as FrontMatter.Meta;
    })
    .sort((a, b) => (Date.parse(a.date) < Date.parse(b.date) ? 1 : -1))
    .slice(0, MAX_POSTS_PER_PAGE);

  return {
    props: { postsMeta },
  };
};

export default Home;
