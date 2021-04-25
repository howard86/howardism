import React, { useMemo } from "react";
import type { GetStaticPropsResult, NextPage } from "next";
import Intro from "@/components/Intro";
import Landing from "@/components/Landing";
import { getRecipes } from "@/services/recipe";
import type { Recipe } from "@/types/recipe";

interface HomeProps {
  recipes: Recipe[];
}

const Home: NextPage<HomeProps> = ({ recipes }) => {
  const memoizedResults = useMemo<Recipe[]>(() => recipes, []);

  // TODO: refactor Landing
  return (
    <>
      <Landing imageUrl={memoizedResults[0].image[0].formats.small.url} />
      <Intro recipes={memoizedResults} />
    </>
  );
};

export const getStaticProps = async (): Promise<GetStaticPropsResult<HomeProps>> => {
  const results = await getRecipes();

  return {
    props: {
      recipes: results,
    },
  };
};

export default Home;
