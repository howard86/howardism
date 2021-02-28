import React, { FC } from "react";
import { Box, Heading } from "@chakra-ui/react";
import PostCard from "@/components/blog/PostCard";

export interface HomeProps {
  postsMeta: FrontMatter.Meta[];
}

const Home: FC<HomeProps> = ({ postsMeta }) => (
  <>
    <Heading mx={[2, 3]}>Howardism</Heading>
    <Box as="ul">
      {postsMeta.map((meta) => (
        <Box key={meta.date} as="li">
          <PostCard title={meta.title} description={meta.description} date={meta.date} tags={[]} />
        </Box>
      ))}
    </Box>
  </>
);

export default Home;
