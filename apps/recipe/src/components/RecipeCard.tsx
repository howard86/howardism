import React, { FC, useState } from "react";
import NextLink from "next/link";
import {
  AspectRatio,
  Heading,
  Img,
  LinkBox,
  LinkOverlay,
  Skeleton,
  Tag,
  Text,
} from "@chakra-ui/react";

interface RecipeCardProps {
  id: string;
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
  const [loaded, setLoaded] = useState(false);
  const daysPassed = getDayDiff(timestamp);

  const handleOnLoad = () => {
    setLoaded(true);
  };

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
      <AspectRatio ratio={16 / 9}>
        <Skeleton startColor="primary.500" endColor="secondary.500" rounded="md" isLoaded={loaded}>
          <Img
            src={imageUrl}
            alt={`recipe photo of ${title}`}
            objectFit="cover"
            onLoad={handleOnLoad}
          />
        </Skeleton>
      </AspectRatio>
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
