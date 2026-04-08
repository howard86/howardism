import { Box, Container, Flex } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import { motion, type Variants } from "framer-motion";
import { useRouter } from "next/router";
import type { ChildrenProps } from "react";

const variants: Variants = {
  pageInital: {
    opacity: 0,
  },
  pageAnimate: {
    opacity: 1,
  },
};

export default function Layout({ children }: ChildrenProps) {
  const router = useRouter();
  const animateKey = router.asPath.includes("?")
    ? router.pathname
    : router.asPath;

  return (
    <Box h="80vh">
      <Flex
        as="nav"
        bg="teal.600"
        color="white"
        fontWeight="bold"
        justify="space-between"
        py={[2, 4]}
      >
        <RouteLink className="ml-2 md:ml-4" href="/">
          Home
        </RouteLink>
      </Flex>
      <Container
        animate="pageAnimate"
        as={motion.main}
        centerContent
        h="full"
        initial="pageInitial"
        key={animateKey}
        maxW="full"
        p={[2, 4, 8]}
        variants={variants}
      >
        {children}
      </Container>
    </Box>
  );
}
