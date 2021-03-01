import React, { FC, memo } from "react";
import { Box, Text } from "@chakra-ui/react";
import RouteLink from "../common/RouteLink";
import Image from "../common/Image";
import Twitter from "../icons/Twitter";
import Github from "../icons/Github";
import Email from "../icons/Email";

const Profile: FC = () => (
  <Box sx={{ textAlign: "center" }}>
    <RouteLink href="/">
      <Image
        src="/profile.jpeg"
        width={400}
        height={400}
        mx="auto"
        w={[12, 24, 48]}
        h="auto"
        borderRadius="lg"
        alt="Profile Picture"
        priority
      />
    </RouteLink>
    <Text as="h3">Howard Tai</Text>
    <Text>A Lifelong Learner</Text>
    <Box>
      <Twitter />
      <Github />
      <Email />
    </Box>
  </Box>
);

export default memo(Profile);
