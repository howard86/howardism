import type { FC } from "react";
import { Code, Divider, ListItem, OrderedList, UnorderedList } from "@chakra-ui/react";

import { H1, H2, H3 } from "./Heading";
import Link from "./Link";
import { BlockQuote, Body } from "./Text";

// Reference: https://www.markdownguide.org/basic-syntax/
const markdown: Record<string, FC> = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: Body,
  blockquote: BlockQuote,
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
  a: Link,
  hr: Divider,
  inlineCode: Code,
};

export default markdown;
