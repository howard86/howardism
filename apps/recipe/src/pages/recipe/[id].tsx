import React from "react";
import { useRouter } from "next/router";
import { Box, Heading, VStack, Text, CheckboxGroup, Spinner } from "@chakra-ui/react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";

import { getRecipeById, Recipe } from "@/services/recipe";
import Image from "@/components/Image";
import { NAV_BAR_HEIGHT } from "@/components/NavBar";
import LayerCheckboxes from "@/components/LayerCheckboxes";
import ProcedureStep from "@/components/ProcedureStep";

interface RecipePageProps {
  recipe: Recipe;
}

const RecipePage: NextPage<RecipePageProps> = ({ recipe }) => {
  const router = useRouter();

  if (router.isFallback) {
    return <Spinner />;
  }

  return (
    <VStack alignItems="start" p="4" spacing="4">
      <Box h={NAV_BAR_HEIGHT} />
      <Image
        src="/assets/demo.jpg"
        width={320}
        height={218}
        borderRadius="lg"
        shadow="lg"
        priority
      />

      <Heading as="h1">Braised Beef Soup</Heading>
      <Text>Amazing soup with care, best for winter!</Text>

      <Heading as="h2" fontSize="lg">
        Ingredients
      </Heading>
      <CheckboxGroup colorScheme="secondary">
        <LayerCheckboxes title="food" options={recipe.food} />
        <LayerCheckboxes title="seasonings" options={recipe.seasonings} />
      </CheckboxGroup>
      <ProcedureStep steps={recipe.steps} />
    </VStack>
  );
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: true,
});

export const getStaticProps: GetStaticProps<RecipePageProps> = async (context) => {
  const id = context.params.id as string;

  const recipe = getRecipeById(id);

  if (recipe === null) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      recipe,
    },
  };
};

export default RecipePage;
