import {
  Box,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Image, RouteLink } from "@howardism/components-common";

import backgroundImage from "@/../public/assets/background.jpg";
import logo from "@/../public/favicon/logo.png";
import type { Recipe } from "@/types/recipe";

export interface HomeProps {
  recipes: Recipe[];
}

const getDayTag = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);

  return days > 0 ? `${days} days ago` : "Today";
};

export default function Home({ recipes }: HomeProps): JSX.Element {
  return (
    <>
      <Flex
        alignItems="center"
        justify="center"
        minH={["100vh", "100vh", 600, 700, 870]}
        pb={[10, 15, 20, 22]}
      >
        <Box
          h="100vh"
          overflow="hidden"
          position="absolute"
          w="full"
          zIndex={-1}
        >
          <Image
            alt="Landing page background"
            layout="fill"
            objectFit="cover"
            objectPosition="center"
            placeholder="blur"
            priority
            src={backgroundImage}
          />
        </Box>
        <Box
          mx="auto"
          pl={{ base: 6, lg: 12 }}
          pr={{ base: 6, md: 0 }}
          w={{ base: "full", md: 900, lg: 1170 }}
        >
          <Box
            bg="white"
            borderRadius="lg"
            maxW="full"
            p={{ base: 6, md: 12 }}
            w={{ md: 400 }}
          >
            <Heading
              _after={{
                content: '""',
                display: "block",
                width: "80px",
                height: 1,
                bg: "blackAlpha.800",
                mt: 4,
              }}
              fontSize={["md", "xl"]}
              fontWeight="medium"
              mb="8"
              position="relative"
            >
              Featured Posts
            </Heading>
            <VStack spacing={2}>
              {recipes.slice(0, 2).map((recipe) => (
                <Flex alignItems="center" key={recipe.id} position="relative">
                  <Box
                    flex={{ base: "0 0 90px", md: "0 0 60px" }}
                    flexShrink={0}
                    overflow="hidden"
                  >
                    <RouteLink href="/">
                      <Image
                        alt="image"
                        height={200}
                        objectFit="cover"
                        src={recipe?.image[0]?.formats.small.url || logo}
                        width={200}
                      />
                    </RouteLink>
                  </Box>

                  <Box flexGrow={1}>
                    <Heading fontSize={{ md: "lg", lg: "xl" }}>
                      <RouteLink
                        href={`recipe/${recipe.id}`}
                        transition="0.15s ease-in-out"
                      >
                        {recipe.title}
                      </RouteLink>
                    </Heading>
                    <Flex alignItems="center" justify="space-between">
                      <HStack
                        alignItems="center"
                        mt={{ base: 2, md: 2.5, lg: 3 }}
                        spacing={[3, 5, 8]}
                      >
                        {recipe.ingredients.slice(0, 3).map((ingredient) => (
                          <RouteLink
                            color="pink.500"
                            href={`/tags/${ingredient.name}`}
                            key={ingredient.name}
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
        mx="auto"
        position="relative"
        px={{ base: 6, md: 12, lg: 0 }}
        py={{ base: 15, md: 20, lg: 30 }}
        w={{ lg: 900, xl: 1170 }}
      >
        <SimpleGrid
          columns={[1, 1, 2, 3]}
          mb={{ base: 2.5, md: 5, lg: 8 }}
          mx="-20px"
          spacing={[4, 6]}
        >
          {recipes.map((recipe) => (
            <Box
              flex="0 0 50%"
              key={recipe.id}
              minW={{ base: "full", md: "50%" }}
              mt={{ base: 50, md: 70, lg: 90 }}
              px={5}
            >
              <Box position="relative">
                <Box
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
                  mb="8"
                  minH="150"
                  position="relative"
                >
                  <RouteLink href={`/recipe/${recipe.id}`}>
                    <Image
                      alt={recipe.title}
                      borderRadius="md"
                      height={360}
                      objectFit="cover"
                      src={recipe?.image[0]?.formats.small.url || logo}
                      width={360}
                    />
                  </RouteLink>
                  <Tag
                    bgColor="primary.900"
                    color="white"
                    fontWeight="bold"
                    left="4"
                    opacity={0.6}
                    position="absolute"
                    size="lg"
                    top="4"
                    zIndex="docked"
                  >
                    {getDayTag(recipe.published_at)}
                  </Tag>
                </Box>
                <Box>
                  <HStack
                    alignItems="center"
                    mb={{ base: 2, md: 2.5, lg: 3 }}
                    spacing={[3, 5, 8]}
                  >
                    {recipe.ingredients.slice(0, 3).map((ingredient) => (
                      <RouteLink
                        color="pink.500"
                        href={`/tags/${ingredient.name}`}
                        key={ingredient.name}
                      >{`#${ingredient.name}`}</RouteLink>
                    ))}
                  </HStack>

                  <Heading fontSize={["md", "lg", "xl"]} mb="2.5">
                    <RouteLink href={`/recipe/${recipe.id}`}>
                      {recipe.title}
                    </RouteLink>
                  </Heading>
                  <Text noOfLines={{ base: 2, lg: 4 }}>
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
}
