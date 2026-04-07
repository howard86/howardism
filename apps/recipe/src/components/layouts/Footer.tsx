import { Box, Link } from "@chakra-ui/react";

export default function Footer(): JSX.Element {
  return (
    <Box
      as="footer"
      overflow="hidden"
      position="relative"
      px="4"
      py={{ base: 5, md: 8 }}
      textAlign="center"
    >
      Copyright &copy; {new Date().getFullYear()}
      <Link
        href="https://github.com/howard86"
        isExternal
        transition="0.15s ease-in-out"
      >
        Howard86
      </Link>
    </Box>
  );
}
