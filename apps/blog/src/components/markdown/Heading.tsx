import { As, Heading, HeadingProps } from "@chakra-ui/react";
import React, { FC } from "react";

const createHeading =
  (as: As, defaultProps?: HeadingProps): FC<HeadingProps> =>
  (props) =>
    <Heading as={as} {...defaultProps} {...props} />;

export const H1 = createHeading("h1", { fontSize: "2.25rem" });
export const H2 = createHeading("h2", {
  fontSize: "1.875rem",
  my: 4,
  fontFamily: "body",
});
export const H3 = createHeading("h3", { fontSize: "1.5rem" });
