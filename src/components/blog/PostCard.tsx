import React, { FC, memo } from "react";
import { Card, Box, Flex, Heading, Text } from "rebass/styled-components";

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
    <Card
      sx={{
        borderStyle: "solid",
        borderColor: "eggshellLight",
        borderRadius: "1rem",
        borderWidth: "1px",
        "&:hover": {
          borderColor: "eggshell",
        },
        my: [2, 3],
      }}
    >
      <Box m={[2, 3]}>
        <Flex justifyContent="space-between" mb={2}>
          <Heading as="h2" sx={{ color: "independence" }}>
            {title}
          </Heading>
          <Text sx={{ color: "terraCottaDark" }}>{date}</Text>
        </Flex>
        {tags.map((tag) => (
          <Text key={`${date}-${tag}`}>{tag}</Text>
        ))}
        <Text
          as="p"
          sx={{
            fontSize: [0, 1, 2],
            color: "grey",
            whiteSpace: "break-spaces",
          }}
        >
          {filterLongContent(description)}
        </Text>
      </Box>
    </Card>
  </RouteLink>
);

export default memo(PostCard);
