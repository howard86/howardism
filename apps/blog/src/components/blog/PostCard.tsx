import React, { FC, memo } from "react";
import NextLink from "next/link";
import { Flex, Heading, LinkBox, LinkOverlay, Text } from "@chakra-ui/react";

interface PostCardProps {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

const PostCard: FC<PostCardProps> = ({ title, date, description, tags }) => (
  <LinkBox
    as="article"
    p="5"
    rounded="lg"
    _hover={{
      bg: "primary.50",
    }}
  >
    <Flex flexDir={["column", "row"]} align="baseline">
      <Heading w="full" fontSize={["lg", "xl", "2xl"]} letterSpacing="wide" noOfLines={1}>
        <NextLink href={`/blog/${date}`} passHref>
          <LinkOverlay>{title}</LinkOverlay>
        </NextLink>
      </Heading>
      <Text as="h4" color="secondary.200" w={["full", 40]} textAlign="end">
        {date}
      </Text>
    </Flex>
    {tags.map((tag) => (
      <Text as="h3" key={date + tag}>
        {tag}
      </Text>
    ))}
    <Text noOfLines={[3, 4, 5]}>{description}</Text>
  </LinkBox>
);

export default memo(PostCard);
