import { ReactNode } from "react";
import { Box, BoxProps, chakra, Container, Heading, Text } from "@chakra-ui/react";

import { HEADER_OFFSET } from "../layout/Header";

interface SectionWrapperProps extends BoxProps {
  tag: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function SectionWrapper({
  tag,
  title,
  description,
  children,
  ...props
}: SectionWrapperProps) {
  return (
    <Box
      id={tag}
      pos="relative"
      as="section"
      minH="100vh"
      bgColor="white"
      pt={HEADER_OFFSET}
      {...props}
    >
      <Container maxW="container.lg" py={6}>
        <chakra.span
          pos="relative"
          fontWeight="medium"
          color="secondary.500"
          mb={3}
          textTransform="capitalize"
          _before={{
            position: "absolute",
            content: "''",
            w: 10,
            height: "1px",
            backgroundColor: "secondary.500",
            top: "50%",
            transform: "translateY(-50%)",
            left: "100%",
            mx: 2.5,
          }}
        >
          {tag}
        </chakra.span>
        <Heading fontSize="5xl" mb={4}>
          {title}
        </Heading>
        <Text mb={6}>{description}</Text>
        {children}
      </Container>
    </Box>
  );
}
