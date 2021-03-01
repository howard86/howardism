import React, { FC } from "react";
import { Heading, List, ListItem } from "@chakra-ui/react";
import PostCard from "@/components/blog/PostCard";

export interface HomeProps {
  postsMeta: FrontMatter.Meta[];
}

const Home: FC<HomeProps> = ({ postsMeta }) => (
  <>
    <Heading as="h1">Howardism</Heading>
    <List>
      {postsMeta.map((meta) => (
        <ListItem key={meta.date}>
          <PostCard title={meta.title} description={meta.description} date={meta.date} tags={[]} />
        </ListItem>
      ))}
    </List>
  </>
);

export default Home;
