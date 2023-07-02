import { Container } from "@/app/(common)/Container"

import ArticleCard from "./articles/ArticleCard"
import { getArticles } from "./articles/service"
import Newsletter from "./NewsLetter"
import Photos from "./Photos"
import Resume from "./Resume"
import SocialLinks from "./SocialLinks"

export default async function Home() {
  const articles = await getArticles()

  return (
    <>
      <Container className="mt-9">
        <div className="max-w-2xl">
          <h2 className="mb-2 text-xl font-bold tracking-tight text-base-content/60 sm:text-2xl">
            Exploring the Depths
          </h2>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            A Software Engineer, Mathematician, and Amateur Diver&apos;s Journey
          </h1>
          <p className="mt-6 text-base text-base-content">
            I&apos;m Howard, a senior fullstack developer at Oddle, a top F&B industry service
            provider based in Singapore, where I am leading software development with
            problem-solving and product-centric mindset.
          </p>
          <SocialLinks />
        </div>
      </Container>
      <Photos />
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16">
            {articles.ids.slice(0, 4).map((slug) => {
              const article = articles.entities[slug]

              return article && <ArticleCard key={slug} slug={slug} meta={article.meta} />
            })}
          </div>
          <div className="space-y-10 lg:pl-16 xl:pl-24">
            <Newsletter />
            <Resume />
          </div>
        </div>
      </Container>
    </>
  )
}
