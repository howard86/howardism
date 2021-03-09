import React, { FC } from "react";
import { As, Heading, HeadingProps } from "@chakra-ui/react";

const createHeading = (as: As): FC<HeadingProps> => (props) => <Heading as={as} {...props} />;

export const H1 = createHeading("h1");
export const H2 = createHeading("h2");
export const H3 = createHeading("h3");
