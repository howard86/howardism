import React, { FC, memo } from "react";
import NextLink from "next/link";
import { Img, Link, Stack, Text, VStack } from "@chakra-ui/react";
import Twitter from "../icons/Twitter";
import Github from "../icons/Github";
import Email from "../icons/Email";

const imageSize = [24, 48, 60];

const Profile: FC = () => (
  <VStack textAlign="center" spacing={[1, 2, 3]}>
    <NextLink href="/" passHref>
      <Link display="inline-block" w={imageSize} h="auto">
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
    <Stack flexDir={["column", "row", "row"]} spacing={[0, 1]} align="baseline">
      <Twitter />
      <Github />
      <Email />
    </Stack>
  </VStack>
);

export default memo(Profile);
