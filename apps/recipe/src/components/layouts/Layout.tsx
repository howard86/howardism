import { Box } from "@chakra-ui/react";
import React, { ReactNode } from "react";
import Sticky from "react-stickynode";

import Footer from "./Footer";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps): JSX.Element => (
  <>
    <Sticky top={0} innerZ={1000} activeClass="nav-sticky">
      <NavBar />
    </Sticky>
    <Box minH={`calc(100vh - 80px)`}>{children}</Box>
    <Footer />
  </>
);

export default Layout;
