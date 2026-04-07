import { cn } from "@howardism/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";

import { getSlicedArticles } from "./articles/service";

export default async function Photos() {
  const articles = await getSlicedArticles(5);

  return (
    <div className="mt-16 sm:mt-20">
      <div className="-my-4 -ml-8 flex gap-5 overflow-hidden py-4 sm:gap-8 md:-ml-4 md:justify-center">
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
              <Link href={`/articles/${article.slug}`}>
                <Image
                  alt={article.meta.image.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                  placeholder="blur"
                  sizes="(min-width: 640px) 18rem, 11rem"
                  src={article.meta.image.src}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
