import { Share2 } from "lucide-react";
import NextLink from "next/link";

import demo from "@/../public/assets/demo.jpg";
import type { Recipe } from "@/types/recipe";

import RecipeCard from "./RecipeCard";

interface IntroProps {
  recipes: Recipe[];
}

export default function Intro({ recipes }: IntroProps) {
  return (
    <div className="p-8">
      <h2 className="font-semibold text-xl">Top Recipes</h2>
      <div className="my-4 space-y-6">
        {recipes.map((recipe) => (
          <RecipeCard
            description={recipe.description}
            id={recipe.id}
            imageUrl={recipe.image[0]?.formats.small.url || demo}
            key={recipe.id}
            timestamp={recipe.published_at}
            title={recipe.title}
          />
        ))}
        <NextLink
          className="block max-w-sm rounded-lg border-2 border-black/40 border-dashed p-4 transition-colors hover:border-black/60"
          href="create"
        >
          <h3 className="flex items-center gap-2 font-semibold text-lg">
            <Share2 className="size-4" />
            Share yours here!
          </h3>
        </NextLink>
      </div>
    </div>
  );
}
