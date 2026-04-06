export interface Recipe {
  description: string;
  id: number;
  image: Image[];
  ingredients: Ingredient[];
  published_at: string;
  seasonings: Seasoning[];
  steps: Step[];
  title: string;
}

export interface RawRecipe {
  description: string;
  ingredients: RawIngredient[];
  seasonings: RawSeasoning[];
  steps: RawStep[];
  title: string;
}
export type RawIngredient = Omit<Ingredient, "id">;
export type RawSeasoning = RawIngredient;
export type RawStep = Omit<Step, "id">;
export interface Ingredient {
  amount: number;
  id: number;
  name: string;
  processing?: string;
  unit: string;
}

export type Seasoning = Ingredient;

export interface Step {
  description: string;
  id: number;
  summary: string;
}

export interface Image extends ImageFormat {
  alternativeText: string;
  caption: string;
  created_by: string;
  formats: {
    thumbnail: ImageFormat;
    small: ImageFormat;
  };
  id: number;
  name: string;
  previewUrl: null;
  provider: "cloudinary";
  updated_by: string;
}

export interface ImageFormat {
  ext: string;
  hash: string;
  height: number;
  mime: string;
  name: string;
  path: null;
  provider_metadata: {
    public_id: string;
    resource_type: string;
  };
  size: number;
  url: string;
  width: number;
}
