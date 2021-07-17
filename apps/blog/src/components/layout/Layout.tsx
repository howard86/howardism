import { Container } from "@chakra-ui/react";
import React, { FC } from "react";

const Layout: FC = ({ children }) => (
  <Container as="main" maxW="container.xl">
    {children}
  </Container>
);

export default Layout;
