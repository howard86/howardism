import React from "react";
import { useRouter } from "next/router";
import { Box, Heading, VStack, Text, CheckboxGroup, Spinner } from "@chakra-ui/react";
import type {
  GetStaticPathsResult,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";

import { getRecipeById, getRecipes } from "@/services/recipe";
import Image from "@/components/Image";
import { NAV_BAR_HEIGHT } from "@/components/NavBar";
import LayerCheckboxes from "@/components/LayerCheckboxes";
import ProcedureStep from "@/components/ProcedureStep";
import type { Recipe } from "@/types/recipe";

const RecipePage: NextPage<Recipe> = (recipe) => {
  const router = useRouter();

  if (router.isFallback) {
    return <Spinner />;
  }

  return (
    <VStack alignItems="start" p="4" spacing="4">
      <Box h={NAV_BAR_HEIGHT} />
      {recipe.image?.[0] && (
        <Image
          alt={recipe.title}
          src={recipe.image[0].formats.small.url}
          width={320}
          height={218}
          borderRadius="lg"
          shadow="lg"
          priority
        />
      )}

      <Heading as="h1">{recipe.title}</Heading>
      <Text>{recipe.description}</Text>

      <CheckboxGroup colorScheme="secondary">
        <LayerCheckboxes title="ingredients" options={recipe.ingredients} />
        <LayerCheckboxes title="seasonings" options={recipe.seasonings} />
      </CheckboxGroup>
      <ProcedureStep steps={recipe.steps} />
    </VStack>
  );
};

type QueryPath = {
  id: string;
};

export const getStaticPaths = async (): Promise<GetStaticPathsResult<QueryPath>> => {
  const results = await getRecipes();

  return {
    paths: results.map((result) => ({
      params: {
        id: result.id.toString(),
      },
    })),
    fallback: false,
  };
};

export const getStaticProps = async (
  context: GetStaticPropsContext<QueryPath>
): Promise<GetStaticPropsResult<Recipe>> => {
  const recipe = await getRecipeById(context.params.id);

  if (recipe === null) {
    return {
      notFound: true,
    };
  }

  return {
    props: recipe,
  };
};

export default RecipePage;
