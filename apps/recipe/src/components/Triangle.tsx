import { chakra, Box } from "@chakra-ui/react";

const Triangle = chakra(Box, {
  baseStyle: {
    w: 0,
    h: 0,
    position: "absolute",
    borderStyle: "solid",
    borderLeftWidth: "50vw",
    borderLeftColor: "primary.600",
    borderBottomWidth: "10vh",
    borderBottomColor: "transparent",
  },
});

export default Triangle;
