import { Box, Flex, Heading, HStack, SimpleGrid, Tag, Text, VStack } from "@chakra-ui/react";
import React from "react";

import backgroundImage from "@/../public/assets/background.jpg";
import logo from "@/../public/favicon/logo.png";
import type { Recipe } from "@/types/recipe";

import Image from "../Image";
import RouteLink from "../RouteLink";

export interface HomeProps {
  recipes: Recipe[];
}

const getDayTag = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);

  return days > 0 ? `${days} days ago` : "Today";
};

const Home = ({ recipes }: HomeProps): JSX.Element => {
  return (
    <>
      <Flex
        alignItems="center"
        justify="center"
        minH={["100vh", 300, 600, 700, 870]}
        py={[10, 15, 20, 22]}
      >
        <Box position="absolute" h="100vh" w="100vw" overflow="hidden" zIndex={-1}>
          <Image
            src={backgroundImage}
            placeholder="blur"
            alt="Landing page background"
            layout="fill"
            objectFit="cover"
            objectPosition="center"
            priority
          />
        </Box>
        <Box
          mx="auto"
          pl={{ base: 6, lg: 12 }}
          pr={{ base: 6, md: 0 }}
          w={{ base: "full", md: 900, lg: 1170 }}
        >
          <Box bg="white" maxW="full" borderRadius="lg" p={{ base: 6, md: 12 }} w={{ md: 400 }}>
            <Heading
              fontWeight="medium"
              position="relative"
              fontSize={["md", "xl"]}
              mb="8"
              _after={{
                content: '""',
                display: "block",
                width: "80px",
                height: 1,
                bg: "blackAlpha.800",
                mt: 4,
              }}
            >
              Featured Posts
            </Heading>
            <VStack spacing={2}>
              {recipes.slice(0, 2).map((recipe) => (
                <Flex key={recipe.id} alignItems="center" position="relative">
                  <Box flex={{ base: "0 0 90px", md: "0 0 60px" }} flexShrink={0} overflow="hidden">
                    <RouteLink href="/">
                      <Image
                        alt="image"
                        width={200}
                        height={200}
                        src={recipe?.image[0]?.formats.small.url || logo}
                        objectFit="cover"
                      />
                    </RouteLink>
                  </Box>

                  <Box flexGrow={1}>
                    <Heading fontSize={{ md: "lg", lg: "xl" }}>
                      <RouteLink transition="0.15s ease-in-out" href={`recipe/${recipe.id}`}>
                        {recipe.title}
                      </RouteLink>
                    </Heading>
                    <Flex alignItems="center" justify="space-between">
                      <HStack
                        alignItems="center"
                        spacing={[3, 5, 8]}
                        mt={{ base: 2, md: 2.5, lg: 3 }}
                      >
                        {recipe.ingredients.slice(0, 3).map((ingredient) => (
                          <RouteLink
                            key={ingredient.name}
                            color="pink.500"
                            href={`/tags/${ingredient.name}`}
                          >{`#${ingredient.name}`}</RouteLink>
                        ))}
                      </HStack>
                    </Flex>
                  </Box>
                </Flex>
              ))}
            </VStack>
          </Box>
        </Box>
      </Flex>
      <Box
        position="relative"
        mx="auto"
        w={{ lg: 900, xl: 1170 }}
        px={{ base: 6, md: 12, lg: 0 }}
        py={{ base: 15, md: 20, lg: 30 }}
      >
        <SimpleGrid
          mx="-20px"
          columns={[1, 1, 2, 3]}
          mb={{ base: 2.5, md: 5, lg: 8 }}
          spacing={[4, 6]}
        >
          {recipes.map((recipe) => (
            <Box
              key={recipe.id}
              flex="0 0 50%"
              px={5}
              minW={{ base: "full", md: "50%" }}
              mt={{ base: 50, md: 70, lg: 90 }}
            >
              <Box position="relative">
                <Box
                  position="relative"
                  minH="150"
                  mb="8"
                  _before={{
                    content: '""',
                    position: "absolute",
                    w: "80%",
                    height: "80%",
                    bgColor: "primary.700",
                    bottom: 0,
                    left: "10%",
                    filter: "blur(15px)",
                  }}
                >
                  <RouteLink href={`/recipe/${recipe.id}`}>
                    <Image
                      alt={recipe.title}
                      width={360}
                      height={360}
                      src={recipe?.image[0]?.formats.small.url || logo}
                      objectFit="cover"
                      borderRadius="md"
                    />
                  </RouteLink>
                  <Tag
                    position="absolute"
                    size="lg"
                    top="4"
                    left="4"
                    color="white"
                    fontWeight="bold"
                    zIndex="docked"
                    bgColor="primary.900"
                    opacity={0.6}
                  >
                    {getDayTag(recipe.published_at)}
                  </Tag>
                </Box>
                <Box>
                  <HStack alignItems="center" spacing={[3, 5, 8]} mb={{ base: 2, md: 2.5, lg: 3 }}>
                    {recipe.ingredients.slice(0, 3).map((ingredient) => (
                      <RouteLink
                        color="pink.500"
                        key={ingredient.name}
                        href={`/tags/${ingredient.name}`}
                      >{`#${ingredient.name}`}</RouteLink>
                    ))}
                  </HStack>

                  <Heading mb="2.5" fontSize={["md", "lg", "xl"]}>
                    <RouteLink href={`/recipe/${recipe.id}`}>{recipe.title}</RouteLink>
                  </Heading>
                  <Text noOfLines={{ base: 2, lg: 4 }} isTruncated>
                    {recipe.description}
                  </Text>
                </Box>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
        {/* TODO: add show more */}
      </Box>
    </>
  );
};

export default Home;
