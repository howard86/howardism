import React, { FC, memo } from "react";
import { Image, Box, Text, Link } from "rebass/styled-components";

const Profile: FC = () => (
  <Box sx={{ textAlign: "center" }}>
    <Link href="https://github.com/howard86" target="_blank">
      <Image src="/profile.jpeg" sx={{ width: "12rem", height: "auto", borderRadius: 9999 }} />
    </Link>
    <Text fontSize={[2, 4, 5]} fontWeight="bold" my={2}>
      Howard Tai
    </Text>
    <Text my={2} fontSize={[1, 2, 3]}>
      A Life Long Learner
    </Text>
  </Box>
);

export default memo(Profile);
