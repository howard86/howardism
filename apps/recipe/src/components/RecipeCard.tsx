import { Heading, LinkBox, LinkOverlay, Tag, Text } from "@chakra-ui/react";
import { Image } from "@howardism/components-common";
import type { StaticImageData } from "next/image";
import NextLink from "next/link";

interface RecipeCardProps {
  description: string;
  id: number;
  imageUrl: string | StaticImageData;
  timestamp: string;
  title: string;
}

const getDayDiff = (timestamp: string): number => {
  const diff = Date.now() - new Date(timestamp).getTime();
  return Math.floor(diff / 1000 / 60 / 60 / 24);
};

export default function RecipeCard({
  id,
  title,
  description,
  timestamp,
  imageUrl,
}: RecipeCardProps) {
  const daysPassed = getDayDiff(timestamp);

  return (
    <LinkBox as="article" bg="secondary.100" p="4" rounded="lg">
      <Tag
        as="time"
        colorScheme="primary"
        dateTime={timestamp}
        left="2"
        position="absolute"
        shadow="dark-lg"
        size="lg"
        top="2"
        variant="solid"
        zIndex="2"
      >
        {daysPassed > 0 ? `${daysPassed} days ago` : "New!"}
      </Tag>
      <Image
        alt={`recipe photo of ${title}`}
        height={300}
        objectFit="cover"
        src={imageUrl}
        width={400}
      />
      <Heading as="h3" color="primary.900" fontSize="lg" my="2">
        <NextLink href={`/recipe/${id}`} passHref>
          <LinkOverlay>{title}</LinkOverlay>
        </NextLink>
      </Heading>
      <Text>{description}</Text>
    </LinkBox>
  );
}
