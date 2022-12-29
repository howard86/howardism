import type { RawRecipe, Recipe } from "@/types/recipe"

import cms from "./cms"

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const response = await cms.get<Recipe[]>("/recipes")
    return response.data.reverse()
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  try {
    const response = await cms.get<Recipe>(`/recipes/${id}`)

    return response.data
  } catch (error) {
    console.error(error)
    return null
  }
}

export const createRecipe = async (recipe: RawRecipe, authHeader: string): Promise<boolean> => {
  await cms.post("recipes", recipe, {
    headers: { Authorization: authHeader },
  })
  return true
}
