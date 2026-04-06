import { Container } from "@chakra-ui/react";
import type { ReactNode } from "react";

import Footer from "./Footer";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): JSX.Element {
  return (
    <>
      <NavBar />
      <Container
        as="main"
        maxW="container.lg"
        minH="calc(100vh - 80px)"
        mt="80px"
      >
        {children}
      </Container>
      <Footer />
    </>
  );
}
