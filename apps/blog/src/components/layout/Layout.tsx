import { Container } from "@chakra-ui/react";
import { ChildrenProps } from "react";

import Footer from "./Footer";

const Layout = ({ children }: ChildrenProps) => (
  <>
    <Container as="main" maxW="container.xl">
      {children}
    </Container>
    <Footer />
  </>
);

export default Layout;
