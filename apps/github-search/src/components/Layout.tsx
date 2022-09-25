import { ChildrenProps } from "react";
import { Box, Container, Flex } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/router";

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
  const animateKey = router.asPath.includes("?") ? router.pathname : router.asPath;

  return (
    <Box h="80vh">
      <Flex
        as="nav"
        bg="teal.600"
        color="white"
        fontWeight="bold"
        py={[2, 4]}
        justify="space-between"
      >
        <RouteLink href="/" ml={[2, 4]}>
          Home
        </RouteLink>
      </Flex>
      <Container
        as={motion.main}
        p={[2, 4, 8]}
        h="full"
        maxW="full"
        variants={variants}
        initial="pageInitial"
        animate="pageAnimate"
        key={animateKey}
        centerContent
      >
        {children}
      </Container>
    </Box>
  );
}
