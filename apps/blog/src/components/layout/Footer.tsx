import { Box, chakra, Link } from "@chakra-ui/react";

export default function Footer(): JSX.Element {
  return (
    <Box
      as="footer"
      px="4"
      py={[6, 8]}
      color="white"
      bgColor="blackAlpha.900"
      textAlign="center"
      boxShadow="lg"
    >
      <chakra.span verticalAlign="sub">&copy;</chakra.span> {new Date().getFullYear()}
      {" by "}
      <Link
        href="https://github.com/howard86"
        _hover={{
          color: "secondary.500",
          textDecor: "underline",
        }}
        isExternal
      >
        Howard86
      </Link>
    </Box>
  );
}
