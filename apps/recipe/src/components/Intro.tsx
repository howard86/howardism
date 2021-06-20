import { Box, Heading, Icon, LinkBox, LinkOverlay, VStack } from "@chakra-ui/react";
import NextLink from "next/link";
import React, { FC } from "react";
import { FiShare } from "react-icons/fi";

import type { Recipe } from "@/types/recipe";

import RecipeCard from "./RecipeCard";

interface IntroProps {
  recipes: Recipe[];
}

const Intro: FC<IntroProps> = ({ recipes }) => {
  return (
    <Box p="8">
      <Heading fontSize="xl">Top Recipes</Heading>
      <VStack my="4" spacing={6}>
        {recipes
          .filter((recipe) => Boolean(recipe.image[0]))
          .map((recipe) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              title={recipe.title}
              description={recipe.description}
              timestamp={recipe.published_at}
              imageUrl={recipe.image[0].formats.small.url}
            />
          ))}
        <LinkBox
          p="4"
          maxW="sm"
          rounded="lg"
          borderStyle="dotted"
          borderWidth="2px"
          borderColor="blackAlpha.400"
        >
          <Heading as="h3" fontSize="lg">
            <NextLink href="create" passHref>
              <LinkOverlay>
                <Icon as={FiShare} /> Share yours here!
              </LinkOverlay>
            </NextLink>
          </Heading>
        </LinkBox>
      </VStack>
    </Box>
  );
};

export default Intro;
