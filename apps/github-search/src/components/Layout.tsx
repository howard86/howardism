import React, { FC } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { motion, Variants } from "framer-motion";
import { Link, Flex, Container } from "@chakra-ui/react";

const variants: Variants = {
  pageInital: {
    opacity: 0,
  },
  pageAnimate: {
    opacity: 1,
  },
};

const Layout: FC = ({ children }) => {
  const router = useRouter();
  const animateKey = router.asPath.includes("?") ? router.pathname : router.asPath;

  return (
    <Container
      as={motion.main}
      p={[2, 6, 8]}
      maxW="full"
      variants={variants}
      initial="pageInitial"
      animate="pageAnimate"
      key={animateKey}
      centerContent
    >
      <Flex mb={[2, 4]} w="full" justify="space-between">
        <NextLink href="/" passHref>
          <Link>Home</Link>
        </NextLink>
      </Flex>
      {children}
    </Container>
  );
};

export default Layout;
