import React, { FC, memo } from "react";
import { Box, Flex } from "rebass/styled-components";

import Nav from "./Nav";
import Profile from "./Profile";

const SideBar: FC = () => (
  <Flex
    py={[3, 4, 5]}
    sx={{
      borderRightWidth: "1px",
      borderRightStyle: "solid",
      borderRightColor: "lightgray",
    }}
    minHeight="90%"
    flexDirection="column"
  >
    <Box alignSelf="flex-end" mx={[2, 3, 4]}>
      <Profile />
      <Nav />
    </Box>
  </Flex>
);

export default memo(SideBar);
