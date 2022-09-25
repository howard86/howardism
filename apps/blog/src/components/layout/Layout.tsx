import { ChildrenProps } from "react";
import { Container } from "@chakra-ui/react";

import Footer from "./Footer";

export default function Layout({ children }: ChildrenProps) {
  return (
    <>
      <Container as="main" maxW="container.xl">
        {children}
      </Container>
      <Footer />
    </>
  );
}
