import { Box, Link } from "@chakra-ui/react";
const Footer = (): JSX.Element => (
  <Box
    as="footer"
    px="4"
    py={[6, 8]}
    mt={[60, 90, 90, 120]}
    textAlign="center"
    borderTopWidth="1px"
    borderTopStyle="solid"
    borderTopColor="blackAlpha.200"
  >
    Copyright &copy; {new Date().getFullYear()}{" "}
    <Link href="https://github.com/howard86" isExternal>
      Howard86
    </Link>
  </Box>
);

export default Footer;
