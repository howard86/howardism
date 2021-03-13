import React, { FC } from "react";
import { As, Text, TextProps } from "@chakra-ui/react";

const createText = (as: As, defaultProps: TextProps): FC<TextProps> => (props: TextProps) => (
  <Text as={as} {...defaultProps} {...props} />
);

export const Body = createText("p", { my: 2 });
export const BlockQuote = createText("blockquote", { px: 4, my: 4 });
