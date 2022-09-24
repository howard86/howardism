import { Box, Container, Flex, Link } from "@chakra-ui/react";
import { motion, Variants } from "framer-motion";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { ChildrenProps } from "react";

const variants: Variants = {
  pageInital: {
    opacity: 0,
  },
  pageAnimate: {
    opacity: 1,
  },
};

const Layout = ({ children }: ChildrenProps) => {
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
        <NextLink href="/" passHref>
          <Link ml={[2, 4]}>Home</Link>
        </NextLink>
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
};

export default Layout;
