import React, { FC, memo } from "react";
import { Box, Flex } from "rebass/styled-components";

import Nav from "./Nav";
import Profile from "./Profile";

const SideBar: FC = () => (
  <Flex flexDirection="column" py={[3, 4]}>
    <Box alignSelf="flex-end" mx={[3, 4]}>
      <Profile />
      <Nav />
    </Box>
  </Flex>
);

export default memo(SideBar);
