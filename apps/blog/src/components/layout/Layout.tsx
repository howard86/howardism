import { ChildrenProps } from "react";
import { Box } from "@chakra-ui/react";

import ScrollProgress from "../animations/ScrollProgress";

import Footer from "./Footer";
import Header from "./Header";

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box position="relative" width="full" height="auto" float="left" sx={{ clear: "both" }}>
      <ScrollProgress />
      <Header />
      <main>{children}</main>
      <Footer />
    </Box>
  );
}
