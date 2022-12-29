import { FC } from "react"
import { AProps, SVGProps } from "react-html-props"
import clsx from "clsx"
import Image from "next/image"

import image1 from "@/assets/alexandre-debieve-chip.jpg"
import image2 from "@/assets/carl-heyerdahl-desk.jpg"
import image3 from "@/assets/john-morgan-sudoku.jpg"
import image4 from "@/assets/thisisengineering-raeng-desk.jpg"
import FstIcon from "@/components/icons/Fst"
import LootexIcon from "@/components/icons/Lootex"
import OddleIcon from "@/components/icons/Oddle"
import { Card, CardCta, CardDescription, CardEyebrow, CardTitle } from "@/components/template/Card"
import { Container } from "@/components/template/Container"
import ExternalLink from "@/components/template/ExternalLink"
import { GitHubIcon, LinkedInIcon, TwitterIcon } from "@/components/template/SocialIcons"
import { formatDate } from "@/utils/time"

function BriefcaseIcon(props: SVGProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.75 9.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="M3 14.25h6.249c.484 0 .952-.002 1.316.319l.777.682a.996.996 0 0 0 1.316 0l.777-.682c.364-.32.832-.319 1.316-.319H21M8.75 6.5V4.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V6.5"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  )
}

type ArticleEntity = {
  slug: string
  title: string
  date: string
  description: string
}

function Article({ article }: { article: ArticleEntity }) {
  return (
    <Card as="article">
      <CardTitle href={`/articles/${article.slug}`}>{article.title}</CardTitle>
      <CardEyebrow as="time" dateTime={article.date} decorate>
        {formatDate(article.date)}
      </CardEyebrow>
      <CardDescription>{article.description}</CardDescription>
      <CardCta>Read article</CardCta>
    </Card>
  )
}

interface SocialLinkProps extends AProps {
  href: string
  icon: FC<SVGProps>
}

function SocialLink({ icon: Icon, ...props }: SocialLinkProps) {
  return (
    <ExternalLink className="group -m-1 p-1" {...props}>
      <Icon className="h-6 w-6 fill-zinc-500 transition group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300" />
    </ExternalLink>
  )
}

type ResumeTime = { label: string; dateTime: string }

type ResumeEntity = {
  company: string
  href: string
  title: string
  logo: FC<SVGProps>
  start: string | ResumeTime
  end: string | ResumeTime
}

const getStringOrValue = (time: string | ResumeTime, key: keyof ResumeTime) =>
  typeof time === "string" ? time : time[key]

const resume: ResumeEntity[] = [
  {
    company: "Oddle",
    href: "https://oddle.me",
    title: "Fullstack Developer",
    logo: OddleIcon,
    start: "2021",
    end: {
      label: "Present",
      dateTime: new Date().getFullYear().toString(),
    },
  },
  {
    company: "Lootex",
    href: "https://lootex.io",
    title: "Product & Engineering",
    logo: LootexIcon,
    start: "2019",
    end: "2020",
  },
  {
    company: "FST Network",
    href: "https://www.fst.network",
    title: "Product Manager",
    logo: FstIcon,
    start: "2018",
    end: "2019",
  },
]

function Resume() {
  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <BriefcaseIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Work</span>
      </h2>
      <ol className="mt-6 space-y-4">
        {resume.map((role) => (
          <li key={role.title} className="flex gap-4">
            <div className="relative mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-gray-200 dark:ring-0">
              <role.logo aria-label={`${role.company} logo`} className="h-7 w-7" />
            </div>
            <dl className="flex flex-auto flex-wrap gap-x-2">
              <dt className="sr-only">Company</dt>
              <dd className="w-full flex-none text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <ExternalLink href={role.href} className="link">
                  {role.company}
                </ExternalLink>
              </dd>
              <dt className="sr-only">Role</dt>
              <dd className="text-xs text-zinc-500 dark:text-zinc-400">{role.title}</dd>
              <dt className="sr-only">Date</dt>
              <dd
                className="ml-auto text-xs text-zinc-400 dark:text-zinc-500"
                aria-label={`${getStringOrValue(role.start, "label")} until ${getStringOrValue(
                  role.end,
                  "label"
                )}`}
              >
                <time dateTime={getStringOrValue(role.start, "dateTime")}>
                  {getStringOrValue(role.start, "label")}
                </time>{" "}
                <span aria-hidden="true">—</span>{" "}
                <time dateTime={getStringOrValue(role.end, "dateTime")}>
                  {getStringOrValue(role.end, "label")}
                </time>
              </dd>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  )
}

const PHOTOS = [image1, image2, image3, image4]

function Photos() {
  const rotations = ["rotate-2", "-rotate-2", "rotate-2", "rotate-2", "-rotate-2"]

  return (
    <div className="mt-16 sm:mt-20">
      <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
        {PHOTOS.map((image, imageIndex) => (
          <div
            key={image.src}
            className={clsx(
              "relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:w-72 sm:rounded-2xl",
              rotations[imageIndex % rotations.length]
            )}
          >
            <Image
              src={image}
              alt=""
              layout="responsive"
              sizes="(min-width: 640px) 18rem, 11rem"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

interface HomeProps {
  articles: ArticleEntity[]
}

export default function Home({ articles = [] }: HomeProps) {
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
          <div className="mt-6 flex gap-6">
            <SocialLink
              href="https://twitter.com/howard86_"
              aria-label="Follow on Twitter"
              icon={TwitterIcon}
            />
            <SocialLink
              href="https://github.com/howard86/"
              aria-label="Follow on GitHub"
              icon={GitHubIcon}
            />
            <SocialLink
              href="https://linkedin.com"
              aria-label="Follow on LinkedIn"
              icon={LinkedInIcon}
            />
          </div>
        </div>
      </Container>
      <Photos />
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16">
            {articles.map((article) => (
              <Article key={article.slug} article={article} />
            ))}
          </div>
          <div className="space-y-10 lg:pl-16 xl:pl-24">
            <Resume />
          </div>
        </div>
      </Container>
    </>
  )
}
