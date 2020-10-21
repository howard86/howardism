import React, { FC, memo } from "react";
import { Image, Box, Text, Link } from "rebass/styled-components";

const Profile: FC = () => (
  <Box sx={{ textAlign: "center" }}>
    <Link href="https://github.com/howard86" target="_blank">
      <Image
        src="/profile.jpeg"
        sx={{ width: ["3rem", "6rem", "12rem"], height: "auto", borderRadius: 9999 }}
      />
    </Link>
    <Text as="h3" my={2}>
      Howard Tai
    </Text>
    <Text my={2}>A Lifelong Learner</Text>
  </Box>
);

export default memo(Profile);
