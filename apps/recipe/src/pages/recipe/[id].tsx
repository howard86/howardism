import type { ParsedUrlQuery } from "node:querystring";
import { Image } from "@howardism/components-common";
import type {
  GetStaticPathsResult,
  GetStaticPropsContext,
  GetStaticPropsResult,
} from "next";
import { useRouter } from "next/router";

import logo from "@/../public/favicon/logo.png";
import LayerCheckboxes from "@/components/LayerCheckboxes";
import { NAV_BAR_HEIGHT } from "@/components/NavBar";
import ProcedureStep from "@/components/ProcedureStep";
import {
  getRecipeById,
  getRecipes,
  RECIPE_ID_PATTERN,
} from "@/services/recipe";
import type { Recipe } from "@/types/recipe";

export default function RecipePage({
  title,
  image,
  description,
  ingredients,
  seasonings,
  steps,
}: Recipe) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-4 sm:gap-6 md:gap-8">
      <div style={{ height: NAV_BAR_HEIGHT }} />
      <Image
        alt={title}
        height={218}
        priority
        src={image[0] ? image[0].formats.small.url : logo}
        style={{
          objectFit: "contain",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}
        width={320}
      />
      <h1 className="font-bold text-2xl">{title}</h1>
      <p>{description}</p>
      <div className="flex w-full max-w-2xl flex-col gap-4 md:flex-row">
        <div className="min-w-60 flex-shrink-0 p-4">
          <LayerCheckboxes options={ingredients} title="材料 🍖" />
          <LayerCheckboxes options={seasonings} title="調味料 🧂" />
        </div>
        <ProcedureStep className="flex-1 p-4" steps={steps} />
      </div>
    </div>
  );
}

interface QueryPath extends ParsedUrlQuery {
  id: string;
}

export const getStaticPaths = async (): Promise<
  GetStaticPathsResult<QueryPath>
> => {
  const results = await getRecipes();

  return {
    paths: results.map((result) => ({
      params: {
        id: result.id.toString(),
      },
    })),
    fallback: "blocking",
  };
};

export const getStaticProps = async (
  context: GetStaticPropsContext<QueryPath>
): Promise<GetStaticPropsResult<Recipe>> => {
  if (!context.params) {
    return { notFound: true };
  }

  const rawId = context.params.id;
  const id = typeof rawId === "string" ? rawId : rawId?.[0];
  if (!(id && RECIPE_ID_PATTERN.test(id))) {
    return { notFound: true };
  }

  const recipe = await getRecipeById(id);

  if (recipe === null) {
    return {
      notFound: true,
    };
  }

  return {
    props: recipe,
    // Update cache every one hour
    revalidate: 3600,
  };
};
