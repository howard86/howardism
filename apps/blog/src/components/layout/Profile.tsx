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
        sx={{
          width: ["3rem", "6rem", "12rem"],
          height: "auto",
          borderRadius: "50%",
          overflow: "hidden",
        }}
        alt="Profile Picture"
        priority
      />
    </RouteLink>
    <Text as="h3" my={2}>
      Howard Tai
    </Text>
    <Text my={2}>A Lifelong Learner</Text>
    <Box mt={[2, 3]}>
      <Twitter />
      <Github />
      <Email />
    </Box>
  </Box>
);

export default memo(Profile);
