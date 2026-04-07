import { Image, RouteLink } from "@howardism/components-common";

import backgroundImage from "@/../public/assets/background.jpg";
import logo from "@/../public/favicon/logo.png";
import type { Recipe } from "@/types/recipe";

export interface HomeProps {
  recipes: Recipe[];
}

const getDayTag = (timestamp: string): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);
  return days > 0 ? `${days} days ago` : "Today";
};

export default function Home({ recipes }: HomeProps): JSX.Element {
  return (
    <>
      {/* Hero section */}
      <div className="relative flex min-h-screen items-center justify-center pb-10 sm:pb-15 md:pb-20 lg:pb-22">
        <div className="absolute inset-0 -z-10 h-screen overflow-hidden">
          <Image
            alt="Landing page background"
            fill
            objectFit="cover"
            objectPosition="center"
            placeholder="blur"
            priority
            src={backgroundImage}
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
        <div className="mx-auto w-full max-w-5xl pr-6 pl-6 md:pr-0 lg:pl-12">
          <div className="w-full rounded-lg bg-white p-6 md:w-[400px] md:p-12">
            {/* Featured Posts heading with after-line decoration */}
            <h2 className="relative mb-8 font-medium text-sm after:mt-4 after:block after:h-px after:w-20 after:bg-black/80 after:content-[''] sm:text-xl">
              Featured Posts
            </h2>
            <div className="space-y-2">
              {recipes.slice(0, 2).map((recipe) => (
                <div className="relative flex items-center" key={recipe.id}>
                  <div className="w-[90px] flex-shrink-0 overflow-hidden md:w-[60px]">
                    <RouteLink href="/">
                      <Image
                        alt="image"
                        height={200}
                        objectFit="cover"
                        src={recipe?.image[0]?.formats.small.url || logo}
                        style={{ objectFit: "cover" }}
                        width={200}
                      />
                    </RouteLink>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-base md:text-lg lg:text-xl">
                      <RouteLink
                        className="transition-colors duration-150 ease-in-out hover:text-[#a73f3f]"
                        href={`recipe/${recipe.id}`}
                      >
                        {recipe.title}
                      </RouteLink>
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="mt-2 flex items-center gap-3 sm:gap-5 md:mt-2.5 md:gap-8 lg:mt-3">
                        {recipe.ingredients.slice(0, 3).map((ingredient) => (
                          <RouteLink
                            className="text-pink-500"
                            href={`/tags/${ingredient.name}`}
                            key={ingredient.name}
                          >{`#${ingredient.name}`}</RouteLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recipe grid */}
      <div className="relative mx-auto w-full px-6 py-15 md:px-12 md:py-20 lg:w-[900px] lg:px-0 lg:py-30 xl:w-[1170px]">
        <div className="-mx-5 mb-2.5 grid grid-cols-1 gap-4 sm:gap-6 md:mb-5 md:grid-cols-2 lg:mb-8 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div
              className="mt-[50px] min-w-full flex-[0_0_50%] px-5 md:mt-[70px] md:min-w-[50%] lg:mt-[90px]"
              key={recipe.id}
            >
              <div className="relative">
                {/* Image container with blur shadow */}
                <div className="relative mb-8 min-h-[150px]">
                  <div className="relative">
                    <RouteLink href={`/recipe/${recipe.id}`}>
                      <Image
                        alt={recipe.title}
                        height={360}
                        src={recipe?.image[0]?.formats.small.url || logo}
                        style={{ objectFit: "cover", borderRadius: "0.375rem" }}
                        width={360}
                      />
                    </RouteLink>
                    {/* Blur glow underneath image */}
                    <div
                      className="absolute bottom-0 left-[10%] h-4/5 w-4/5 blur-[15px]"
                      style={{ background: "#5f2222", zIndex: -1 }}
                    />
                  </div>
                  <span
                    className="absolute top-4 left-4 rounded-md px-2 py-0.5 font-bold text-sm text-white"
                    style={{ background: "#1c0303", opacity: 0.6, zIndex: 10 }}
                  >
                    {getDayTag(recipe.published_at)}
                  </span>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-3 sm:gap-5 md:mb-2.5 md:gap-8 lg:mb-3">
                    {recipe.ingredients.slice(0, 3).map((ingredient) => (
                      <RouteLink
                        className="text-pink-500"
                        href={`/tags/${ingredient.name}`}
                        key={ingredient.name}
                      >{`#${ingredient.name}`}</RouteLink>
                    ))}
                  </div>
                  <h3 className="mb-2.5 font-semibold text-sm sm:text-base md:text-lg lg:text-xl">
                    <RouteLink href={`/recipe/${recipe.id}`}>
                      {recipe.title}
                    </RouteLink>
                  </h3>
                  <p className="line-clamp-2 lg:line-clamp-4">
                    {recipe.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* TODO: add show more */}
      </div>
    </>
  );
}
