import axios from "axios";
import type { Recipe } from "@/types/recipe";

const API_BASE_URL = process.env.CMS_URL;

export const getRecipes = async (): Promise<Recipe[]> => {
  try {
    const response = await axios.get<Recipe[]>(`${API_BASE_URL}/recipes`);
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  try {
    const response = await axios.get<Recipe>(`${API_BASE_URL}/recipes/${id}`);

    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
