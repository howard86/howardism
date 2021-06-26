import type { GetStaticPropsResult } from "next";

import Home from "@/components/templates/Home";
import { getRecipes } from "@/services/recipe";
import type { Recipe } from "@/types/recipe";

interface HomeProps {
  recipes: Recipe[];
}

export const getStaticProps = async (): Promise<GetStaticPropsResult<HomeProps>> => {
  const results = await getRecipes();

  return {
    props: {
      recipes: results,
    },
    // Update every one hour
    revalidate: 3600,
  };
};

export default Home;
