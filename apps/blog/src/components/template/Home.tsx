import { Box, Container, Heading, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { Image } from "@howardism/components-common";
import React from "react";
import { FaGithub, FaRegEnvelope, FaTwitter } from "react-icons/fa";

import profile from "@/../public/profile.jpeg";

import SocialIconLink from "../blog/SocialIconLink";

const Home = (): JSX.Element => (
  <Container
    textAlign="center"
    width="610"
    pt={[50, 70, 100, 120, 150]}
    px={[6, 2.5]}
    centerContent
  >
    <Box
      w={[180, 180, 220, 270]}
      h={[180, 180, 220, 270]}
      p={[5, 5, 6, 8]}
      mb={[5, 5, 6, 8]}
      mx="auto"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="blackAlpha.200"
      borderRadius="full"
    >
      <Image
        borderRadius="full"
        src={profile}
        alt="profile"
        placeholder="blur"
        layout="responsive"
        width={270}
        height={270}
      />
    </Box>
    <Heading as="h1" mb={{ base: 4, lg: 5 }} fontSize={["lg", "xl", "2xl"]} fontWeight="medium">
      Hey! I’m <Text as="b">Howard</Text>
    </Heading>
    <Text mb={{ base: 6, lg: 8 }}>A Lifelong Learner</Text>
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
);

export default Home;
