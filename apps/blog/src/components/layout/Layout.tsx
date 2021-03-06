import React, { FC } from "react";
import { Container, HStack, Divider, Box } from "@chakra-ui/react";
import SideBar from "@/components/layout/SideBar";

const Layout: FC = ({ children }) => (
  <Container as={HStack} maxW="120ch" alignItems="start" my={[8, 12, 16]}>
    <SideBar />
    <Box h="70vh">
      <Divider orientation="vertical" />
    </Box>
    <Container maxW="90ch" as="main">
      {children}
    </Container>
  </Container>
);

export default Layout;
