import { StackProps, VStack } from "@chakra-ui/react";
import React, { FC } from "react";

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
