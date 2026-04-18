import type { RawRecipe, Recipe } from "@/types/recipe";

import cms from "./cms";

export const RECIPE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const response = await cms.get<Recipe[]>("/recipes");
    return response.data.reverse();
  } catch (error) {
    console.error("Failed to fetch recipes:", (error as Error).message);
    return [];
  }
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  if (!RECIPE_ID_PATTERN.test(id)) {
    return null;
  }

  try {
    const response = await cms.get<Recipe>(
      `/recipes/${encodeURIComponent(id)}`
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch recipe:", (error as Error).message);
    return null;
  }
};

export const createRecipe = async (
  recipe: RawRecipe,
  jwt: string
): Promise<boolean> => {
  try {
    await cms.post("recipes", recipe, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return true;
  } catch (error) {
    console.error("Failed to create recipe:", (error as Error).message);
    return false;
  }
};
