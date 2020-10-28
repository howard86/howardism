import React, { FC, memo } from "react";
import { Box, Text, Link } from "rebass/styled-components";
import Image from "./common/Image";

const Profile: FC = () => (
  <Box sx={{ textAlign: "center" }}>
    <Link href="https://github.com/howard86" target="_blank">
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
        priority
      />
    </Link>
    <Text as="h3" my={2}>
      Howard Tai
    </Text>
    <Text my={2}>A Lifelong Learner</Text>
  </Box>
);

export default memo(Profile);
