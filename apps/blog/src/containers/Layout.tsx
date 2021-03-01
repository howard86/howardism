import React, { FC } from "react";
import { Box, Flex } from "@chakra-ui/react";
import { useRouter } from "next/router";
import SideBar from "@/components/layout/SideBar";

const Layout: FC = ({ children }) => {
  const route = useRouter();

  return (
    <Flex mx="auto" flexDirection="row" flexWrap="wrap">
      <Box />
      <Box minH="90vh">
        <SideBar path={route.pathname} />
      </Box>
      <Box as="main">{children}</Box>
    </Flex>
  );
};

export default Layout;
