import React, { FC } from "react";
import { Box, Flex } from "rebass/styled-components";

import SideBar from "./SideBar";

const Layout: FC = ({ children }) => (
  <Box sx={{ maxWidth: 2048, mx: "auto" }} fontSize={[1, 2, 3]} pt={[3, 4, 5]}>
    <Flex flexDirection="row" flex-wrap="wrap">
      <SideBar />
      <Box as="main" width={2 / 3}>
        {children}
      </Box>
    </Flex>
  </Box>
);

export default Layout;
