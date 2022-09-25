import { FaGithub, FaRegEnvelope, FaTwitter } from "react-icons/fa";
import { Box, Container, Heading, SimpleGrid, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { Image } from "@howardism/components-common";

import profile from "@/../public/profile.jpeg";

import type { PostCardProps } from "../blog/PostCard";
import PostCard from "../blog/PostCard";
import SocialIconLink from "../blog/SocialIconLink";

export interface HomeProps {
  posts: PostCardProps[];
}

export default function Home({ posts }: HomeProps): JSX.Element {
  return (
    <>
      <Container
        id="home"
        maxW="container.sm"
        textAlign="center"
        pt={[50, 70, 100, 120, 150]}
        px={[6, 2.5]}
        centerContent
      >
        <Box
          w={[180, 180, 220, 270]}
          h={[180, 180, 220, 270]}
          p={[5, 5, 6, 8]}
          mb={[5, 5, 6, 8]}
          borderWidth="1px"
          borderStyle="solid"
          borderColor="blackAlpha.200"
          borderRadius="full"
        >
          <Image borderRadius="full" src={profile} alt="profile" priority />
        </Box>
        <Heading as="h1" mb={{ base: 4, lg: 5 }} fontSize={["lg", "xl", "2xl"]} fontWeight="medium">
          Hey! I’m <Text as="b">Howard</Text>
        </Heading>
        <Text mb={{ base: 6, lg: 8 }}>
          A Lifelong Learner. Enthusiastic about technology and how it has revolutionised our daily
          lives.
        </Text>
        <Wrap>
          <WrapItem>
            <SocialIconLink href="https://twitter.com/howard86_" label="Twitter" icon={FaTwitter} />
          </WrapItem>
          <WrapItem>
            <SocialIconLink href="https://github.com/howard86" label="Github" icon={FaGithub} />
          </WrapItem>
          <WrapItem>
            <SocialIconLink href="mailto:howard@howardism.dev" label="Email" icon={FaRegEnvelope} />
          </WrapItem>
        </Wrap>
      </Container>
      <SimpleGrid id="contact" pt={[30, 30, 50]} columns={[1, 1, 2]} spacing={[10, 12, 16]}>
        {posts.map((post) => (
          <PostCard key={post.slug} {...post} />
        ))}
      </SimpleGrid>
    </>
  );
}
