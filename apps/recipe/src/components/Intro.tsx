import {
  Box,
  Heading,
  Icon,
  LinkBox,
  LinkOverlay,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { FiShare } from "react-icons/fi";

import demo from "@/../public/assets/demo.jpg";
import type { Recipe } from "@/types/recipe";

import RecipeCard from "./RecipeCard";

interface IntroProps {
  recipes: Recipe[];
}

export default function Intro({ recipes }: IntroProps) {
  return (
    <Box p="8">
      <Heading fontSize="xl">Top Recipes</Heading>
      <VStack my="4" spacing={6}>
        {recipes.map((recipe) => (
          <RecipeCard
            description={recipe.description}
            id={recipe.id}
            imageUrl={recipe.image[0]?.formats.small.url || demo}
            key={recipe.id}
            timestamp={recipe.published_at}
            title={recipe.title}
          />
        ))}
        <LinkBox
          borderColor="blackAlpha.400"
          borderStyle="dotted"
          borderWidth="2px"
          maxW="sm"
          p="4"
          rounded="lg"
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
}
