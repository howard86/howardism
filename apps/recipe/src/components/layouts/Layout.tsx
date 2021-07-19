import { Container } from "@chakra-ui/react";
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
    <Container as="main" maxW="container.lg" minH={`calc(100vh - 80px)`}>
      {children}
    </Container>
    <Footer />
  </>
);

export default Layout;
