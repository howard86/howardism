import React, { FC } from "react";
import { Box, Flex } from "rebass/styled-components";

const Layout: FC = ({ children }) => (
  <Box sx={{ maxWidth: 2048, mx: "auto", px: 3 }}>
    <Flex flexDirection="row" flex-wrap="wrap">
      <Box px={2} py={2} width={1 / 3} sx={{ borderRight: "1px solid ", borderColor: "lightgray" }}>
        <Box mx="auto" />
        {/* TODO: add SideBar */}
      </Box>
      <Box px={2} py={2} width={2 / 3}>
        {children}
      </Box>
    </Flex>
  </Box>
);

export default Layout;
