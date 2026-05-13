import { cn } from "@howardism/ui/lib/utils";
import Image from "next/image";

import { getSlicedArticles } from "./articles/service";

// Decorative band of recent article covers. Non-interactive — there is no gallery page to link to.
export default async function CoverCarousel() {
  const articles = await getSlicedArticles(5);

  return (
    <div aria-hidden="true" className="mt-16 sm:mt-20">
      <div className="-my-4 ml-0 flex gap-5 overflow-hidden py-4 sm:-ml-8 sm:gap-8 md:-ml-4 md:justify-center">
        {articles.ids.map((id, index) => {
          const article = articles.entities[id];

          if (!article) {
            return null;
          }

          return (
            <div
              className={cn(
                "relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-background sm:w-72 sm:rounded-2xl",
                index % 2 ? "rotate-2" : "-rotate-2"
              )}
              key={article.slug}
            >
              <Image
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                placeholder="blur"
                sizes="(min-width: 640px) 18rem, 11rem"
                src={article.meta.image.src}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
