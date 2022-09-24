import { Box, Flex, Heading, LinkBox, LinkOverlay, Tag, Text } from "@chakra-ui/react";
import { Image, RouteLink } from "@howardism/components-common";
import dayjs from "dayjs";
import { StaticImageData } from "next/image";
import NextLink from "next/link";

import chip from "@/assets/alexandre-debieve-chip.jpg";
import monitor from "@/assets/carl-heyerdahl-desk.jpg";
import desk from "@/assets/thisisengineering-raeng-desk.jpg";

export interface PostCardProps {
  id: number;
  title: string;
  slug: string;
  date: string;
  description: string;
  tags: string[];
}

const DEFAULT_IMAGES: StaticImageData[] = [chip, monitor, desk];

const PostCard = ({ id, title, slug, date, description, tags }: PostCardProps) => {
  const day = dayjs(date);

  return (
    <LinkBox as="article" position="relative">
      <Box
        mb="12"
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          width: "80%",
          height: "80%",
          bgColor: "primary.800",
          bottom: 0,
          left: "10%",
          filter: "blur(15px)",
        }}
      >
        <Image
          alt="chip"
          layout="responsive"
          src={DEFAULT_IMAGES[id % 3]}
          width={400}
          height={300}
          rounded="md"
          objectFit="cover"
        />
      </Box>
      <Flex>
        <Box
          display={["none", "flex"]}
          flexDirection="column"
          textAlign="center"
          pb="4"
          px={[0, 5, 6, 8]}
          pt={[0, 5, 6, 8]}
          mr={[0, 6]}
        >
          <Text fontWeight="bold" fontSize={["xl", "2xl", "3xl", "4xl"]}>
            {day.format("DD")}
          </Text>
          <Text as="span" fontSize="sm">
            {day.format("MMM")}
          </Text>
        </Box>
        <Box alignSelf="center">
          <Heading fontSize={["lg", "lg", "xl", "2xl"]} mb={[2.5, 3, 2.5]}>
            <NextLink href={`/blog/${slug}`} passHref>
              <LinkOverlay>{title}</LinkOverlay>
            </NextLink>
          </Heading>
          <Text noOfLines={4}>{description}</Text>
          {tags.map((tag) => (
            <Tag key={`${id}${tag}`}>
              <RouteLink href={`/tags/${tag}`}>`#${tag}`</RouteLink>
            </Tag>
          ))}
        </Box>
      </Flex>
    </LinkBox>
  );
};

export default PostCard;
