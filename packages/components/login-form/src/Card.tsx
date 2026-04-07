import { Box, type BoxProps } from "@chakra-ui/react";

export default function Card(props: BoxProps): JSX.Element {
  return (
    <Box
      bg="white"
      px={{ base: 4, md: 10 }}
      py="8"
      rounded={{ sm: "lg" }}
      shadow="base"
      {...props}
    />
  );
}
