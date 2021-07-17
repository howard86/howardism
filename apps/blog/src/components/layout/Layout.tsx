import { Container } from "@chakra-ui/react";
import React, { FC } from "react";

import Footer from "./Footer";

const Layout: FC = ({ children }) => (
  <>
    <Container as="main" maxW="container.xl">
      {children}
    </Container>
    <Footer />
  </>
);

export default Layout;
