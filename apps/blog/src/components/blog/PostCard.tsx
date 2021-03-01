import React, { FC, memo } from "react";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import { filterLongContent } from "@/utils/filter";
import RouteLink from "../common/RouteLink";

interface PostCardProps {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

const PostCard: FC<PostCardProps> = ({ title, date, description, tags }) => (
  <RouteLink href={`/blog/${date}`}>
    <Box
      borderColor="primary.50"
      borderStyle="solid"
      borderRadius="4"
      borderWidth="4"
      _hover={{
        borderCollor: "primary.100",
      }}
    >
      <Box m={[8, 12]}>
        <Flex justify="space-between">
          <Heading as="h2" color="primary.800">
            {title}
          </Heading>
          <Text color="secondary.100">{date}</Text>
        </Flex>
        {tags.map((tag) => (
          <Text key={`${date}-${tag}`}>{tag}</Text>
        ))}
        <Text as="p" color="gray" whiteSpace="break-spaces">
          {filterLongContent(description)}
        </Text>
      </Box>
    </Box>
  </RouteLink>
);

export default memo(PostCard);
