import React, { FC } from "react";
import { Box, Flex } from "rebass/styled-components";

import SideBar from "./SideBar";

const Layout: FC = ({ children }) => (
  <Flex
    sx={{ maxWidth: 2048, mx: "auto" }}
    fontSize={[0, 1, 2]}
    pt={[3, 4, 5]}
    flexDirection="row"
    flex-wrap="wrap"
  >
    <Box width={[0, 1 / 12, 1 / 6]} />
    <Box width={1 / 6} minHeight="90vh">
      <SideBar />
    </Box>
    <Box as="main" width={[5 / 6, 2 / 3, 1 / 2]}>
      {children}
    </Box>
  </Flex>
);

export default Layout;
