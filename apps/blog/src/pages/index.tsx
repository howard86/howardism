import React from "react";
import { Heading, List, ListItem } from "@chakra-ui/react";
import type { GetStaticProps, NextPage } from "next";

import PostCard, { PostCardProps } from "@/components/blog/PostCard";
import { fetchBlogPosts } from "@/services/cms";

interface HomeProps {
  meta: PostCardProps[];
}

const Home: NextPage<HomeProps> = ({ meta }) => (
  <>
    <Heading as="h1" mx="5">
      Howardism
    </Heading>
    <List my="2">
      {meta.map((meta) => (
        <ListItem key={meta.date}>
          <PostCard {...meta} />
        </ListItem>
      ))}
    </List>
  </>
);

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const posts = await fetchBlogPosts();

  return {
    props: {
      meta: posts.map((post) => ({
        id: post.id,
        title: post.title,
        description: "",
        tags: [],
        date: post.displayDate || post.created_at,
      })),
    },
  };
};

export default Home;
