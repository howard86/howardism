import { Box, BoxProps } from "@chakra-ui/react";
import React from "react";

const Card = (props: BoxProps): JSX.Element => (
  <Box bg="white" py="8" px={{ base: 4, md: 10 }} shadow="base" rounded={{ sm: "lg" }} {...props} />
);

export default Card;
