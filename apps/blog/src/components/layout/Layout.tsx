import { ChildrenProps } from "react";
import { Box, Container } from "@chakra-ui/react";
import dynamic from "next/dynamic";

import Footer from "./Footer";
import Header from "./Header";
import ScrollToTop from "./ScrollToTop";

const DynamicAnimatedCursor = dynamic(() => import("react-animated-cursor"), { ssr: false });

export default function Layout({ children }: ChildrenProps) {
  return (
    <Box position="relative" width="full" height="auto" float="left" sx={{ clear: "both" }}>
      <DynamicAnimatedCursor
        innerSize={8}
        outerSize={44}
        color="245, 34, 37"
        outerAlpha={0.3}
        innerScale={0.7}
        outerScale={1.2}
      />
      <ScrollToTop />
      <Header />
      <Container as="main" maxW="container.xl">
        {children}
      </Container>
      <Footer />
    </Box>
  );
}
