import { ChildrenProps } from "react";
import { Box } from "@chakra-ui/react";

import Footer from "./Footer";
import Header from "./Header";
import ScrollToTop from "./ScrollToTop";

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box position="relative" width="full" height="auto" float="left" sx={{ clear: "both" }}>
      <ScrollToTop />
      <Header />
      <main>{children}</main>
      <Footer />
    </Box>
  );
}
