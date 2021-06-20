import { Flex, Img, Link, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import React, { FC, memo } from "react";

import Email from "../icons/Email";
import Github from "../icons/Github";
import Twitter from "../icons/Twitter";

const imageSize = [24, 48, 60];

const Profile: FC = () => (
  <VStack textAlign="center" spacing={[1, 2, 3]}>
    <NextLink href="/" passHref>
      <Link display="inline-block" maxW={imageSize} h="auto">
        {/* TODO: use Next.js next/image to improve */}
        <Img src="/profile.jpeg" borderRadius="full" alt="Profile Picture" w={imageSize} h="auto" />
      </Link>
    </NextLink>
    <Text as="h3" fontSize={["md", "lg", "2xl"]} fontWeight="medium">
      Howard Tai
    </Text>
    <Text as="h4" fontSize={["sm", "md"]}>
      A Lifelong Learner
    </Text>
    <Flex width={4 / 5} justify="space-evenly" align="center" flexDir={["column", "column", "row"]}>
      <Twitter />
      <Github />
      <Email />
    </Flex>
  </VStack>
);

export default memo(Profile);
