import React, { FC } from "react";
import { VStack, StackProps } from "@chakra-ui/react";

import Nav from "./Nav";
import Profile from "./Profile";

type SideBarProps = StackProps;

const SideBar: FC<SideBarProps> = (props) => (
  <VStack {...props} spacing={[2, 4]}>
    <Profile />
    <Nav />
  </VStack>
);

export default SideBar;
