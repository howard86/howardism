import { Box, Container, Divider, HStack } from "@chakra-ui/react";
import React, { FC } from "react";

import SideBar from "@/components/layout/SideBar";

const Layout: FC = ({ children }) => (
  <Container as={HStack} maxW="120ch" alignItems="start" my={[8, 12, 16]} spacing={4}>
    <SideBar />
    <Box h="70vh">
      <Divider orientation="vertical" />
    </Box>
    <Container as="main" maxW="full">
      {children}
    </Container>
  </Container>
);

export default Layout;
