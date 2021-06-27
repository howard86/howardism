import { Box, Link } from "@chakra-ui/react";
import React from "react";

const Footer = (): JSX.Element => (
  <Box
    as="footer"
    position="relative"
    overflow="hidden"
    py={{ base: 5, md: 8 }}
    px="4"
    textAlign="center"
  >
    Copyright &copy; {new Date().getFullYear()}
    <Link transition="0.15s ease-in-out" href="https://github.com/howard86" isExternal>
      Howard86
    </Link>
  </Box>
);

export default Footer;
