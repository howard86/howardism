import { Container } from "@chakra-ui/react";
import { ReactNode } from "react";

import Footer from "./Footer";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps): JSX.Element => (
  <>
    <NavBar />
    <Container as="main" mt="80px" maxW="container.lg" minH={`calc(100vh - 80px)`}>
      {children}
    </Container>
    <Footer />
  </>
);

export default Layout;
