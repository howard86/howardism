import type { GetStaticPropsResult, NextPage } from "next";
import React from "react";

import demo from "@/../public/assets/demo.jpg";
import Intro from "@/components/Intro";
import Landing from "@/components/Landing";
import { getRecipes } from "@/services/recipe";
import type { Recipe } from "@/types/recipe";

interface HomeProps {
  recipes: Recipe[];
}

/* TODO: refactor Landing*/
const Home: NextPage<HomeProps> = ({ recipes }) => (
  <>
    <Landing imageUrl={recipes[0]?.image[0]?.formats.small.url || demo} />
    <Intro recipes={recipes} />
  </>
);

export const getStaticProps = async (): Promise<GetStaticPropsResult<HomeProps>> => {
  const results = await getRecipes();

  return {
    props: {
      recipes: results,
    },
  };
};

export default Home;
