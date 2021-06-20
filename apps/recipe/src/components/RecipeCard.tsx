import { Heading, LinkBox, LinkOverlay, Tag, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React, { FC } from "react";

import Image from "@/components/Image";

interface RecipeCardProps {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  imageUrl: string;
}

const getDayDiff = (timestamp: string): number => {
  const diff = Date.now() - new Date(timestamp).getTime();
  return Math.floor(diff / 1000 / 60 / 60 / 24);
};

const RecipeCard: FC<RecipeCardProps> = ({ id, title, description, timestamp, imageUrl }) => {
  const daysPassed = getDayDiff(timestamp);

  return (
    <LinkBox as="article" p="4" bg="secondary.100" rounded="lg">
      <Tag
        as="time"
        dateTime={timestamp}
        position="absolute"
        top="2"
        left="2"
        size="lg"
        colorScheme="primary"
        variant="solid"
        zIndex="2"
        shadow="dark-lg"
      >
        {daysPassed > 0 ? `${daysPassed} days ago` : "New!"}
      </Tag>
      <Image
        src={imageUrl}
        width={400}
        height={300}
        alt={`recipe photo of ${title}`}
        objectFit="cover"
      />
      <Heading as="h3" fontSize="lg" color="primary.900" my="2">
        <NextLink href={`/recipe/${id}`} passHref>
          <LinkOverlay>{title}</LinkOverlay>
        </NextLink>
      </Heading>
      <Text>{description}</Text>
    </LinkBox>
  );
};

export default RecipeCard;
