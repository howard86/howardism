import clsx from "clsx"
import Image from "next/image"

import { getArticles } from "./articles/service"

export default async function Photos() {
  const articles = await getArticles()

  return (
    <div className="mt-16 sm:mt-20">
      <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
        {articles.ids.map((id, index) => {
          const article = articles.entities[id]

          if (!article) return null

          return (
            <div
              key={article.slug}
              className={clsx(
                "relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-base-100 sm:w-72 sm:rounded-2xl",
                index % 2 ? "rotate-2" : "-rotate-2"
              )}
            >
              <Image
                src={article.meta.image.src}
                alt={article.meta.image.alt}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="(min-width: 640px) 18rem, 11rem"
                placeholder="blur"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
