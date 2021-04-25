export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: Ingredient[];
  seasonings: Seasoning[];
  steps: Step[];
  image: Image[];
  published_at: string;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  processing?: string;
  amount: number;
}

export type Seasoning = Ingredient;

export interface Step {
  id: number;
  summary: string;
  description: string;
}

export interface Image extends ImageFormat {
  id: number;
  name: string;
  alternativeText: string;
  caption: string;
  formats: {
    thumbnail: ImageFormat;
    small: ImageFormat;
  };
  previewUrl: null;
  provider: "cloudinary";
  created_by: string;
  updated_by: string;
}

export interface ImageFormat {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: null;
  size: number;
  width: number;
  height: number;
  provider_metadata: {
    public_id: string;
    resource_type: string;
  };
}
