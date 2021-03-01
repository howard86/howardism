import React, { FC } from "react";
import { Container, HStack, Divider } from "@chakra-ui/react";
import { useRouter } from "next/router";
import SideBar from "@/components/layout/SideBar";

const Layout: FC = ({ children }) => {
  const route = useRouter();

  return (
    <Container as={HStack} maxW="120ch">
      <SideBar path={route.pathname} />
      <Divider orientation="vertical" />
      <Container as="main">{children}</Container>
    </Container>
  );
};

export default Layout;
