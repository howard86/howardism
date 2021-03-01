import React, { FC, memo } from "react";
import { Box, Flex } from "@chakra-ui/react";

import Nav from "./Nav";
import Profile from "./Profile";

interface SideBarProps {
  path: string;
}

const SideBar: FC<SideBarProps> = ({ path }) => (
  <Flex
    borderRightWidth="4"
    borderRightStyle="solid"
    borderRightColor="blackAlpha.200"
    minH="90%"
    flexDirection="column"
  >
    <Box alignSelf="flex-end">
      <Profile />
      <Nav path={path} />
    </Box>
  </Flex>
);

export default memo(SideBar);
