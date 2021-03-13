import { UnorderedList, OrderedList, ListItem, Divider, Code } from "@chakra-ui/layout";
import type { MdxRemote } from "next-mdx-remote/types";
import { H1, H2, H3 } from "./Heading";
import { BlockQuote, Body } from "./Text";
import Link from "./Link";

// Reference: https://www.markdownguide.org/basic-syntax/
const markdown: MdxRemote.Components = {
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
