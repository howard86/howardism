import { Flex, Text, VStack } from "@chakra-ui/react";
import { Image, RouteLink } from "@howardism/components-common";

import profilePicture from "@/../public/profile.jpeg";

import Email from "../icons/Email";
import Github from "../icons/Github";
import Twitter from "../icons/Twitter";

const imageSize = [24, 48, 60];

export default function Profile() {
  return (
    <VStack textAlign="center" spacing={[1, 2, 3]}>
      <RouteLink href="/" display="inline-block" maxW={imageSize} h="auto">
        <Image src={profilePicture} placeholder="blur" alt="Profile Picture" />
      </RouteLink>
      <Text as="h3" fontSize={["md", "lg", "2xl"]} fontWeight="medium">
        Howard Tai
      </Text>
      <Text as="h4" fontSize={["sm", "md"]}>
        A Lifelong Learner
      </Text>
      <Flex
        width={4 / 5}
        justify="space-evenly"
        align="center"
        flexDir={["column", "column", "row"]}
      >
        <Twitter />
        <Github />
        <Email />
      </Flex>
    </VStack>
  );
}
