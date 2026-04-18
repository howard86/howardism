import { z } from "zod";

const ingredientSchema = z.object({
  amount: z.number(),
  name: z.string(),
  processing: z.string().optional(),
  unit: z.string(),
});

const stepSchema = z.object({
  description: z.string(),
  summary: z.string(),
});

export const recipeSchema = z.looseObject({
  description: z.string(),
  title: z.string(),
  ingredients: z.array(ingredientSchema),
  seasonings: z.array(ingredientSchema),
  steps: z.array(stepSchema),
});

export const loginSchema = z.object({
  identifier: z.string(),
  password: z.string(),
});
