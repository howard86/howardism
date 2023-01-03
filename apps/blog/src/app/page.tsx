import { Container } from "@/components/template/Container"
import { getAllArticles } from "@/services/article"

import ArticleCard from "./ArticleCard"
import Newsletter from "./NewsLetter"
import Photos from "./Photos"
import Resume from "./Resume"
import SocialLinks from "./SocialLinks"

export default async function Home() {
  const articles = await getAllArticles()

  return (
    <>
      <Container className="mt-9">
        <div className="max-w-2xl">
          <h2 className="mb-2 text-xl font-bold tracking-tight text-zinc-500 dark:text-zinc-300 sm:text-2xl">
            Exploring the Depths
          </h2>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-4xl">
            A Software Engineer, Mathematician, and Amateur Diver&apos;s Journey
          </h1>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
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
            {articles.slice(0, 4).map((article) => (
              <ArticleCard key={article.slug} slug={article.slug} meta={article.meta} />
            ))}
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
