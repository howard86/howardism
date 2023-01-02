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
import { Button } from "@/components/template/Button"
import { Card, CardCta, CardDescription, CardEyebrow, CardTitle } from "@/components/template/Card"
import { Container } from "@/components/template/Container"
import ExternalLink from "@/components/template/ExternalLink"
import {
  BriefcaseIcon,
  EmailIcon,
  GitHubIcon,
  LinkedInIcon,
  MailIcon,
  RssIcon,
  TwitterIcon,
} from "@/components/template/SocialIcons"
import { ArticleEntity, getAllArticles } from "@/services/article"
import { formatDate } from "@/utils/time"

function Article({ slug, meta }: ArticleEntity) {
  return (
    <Card as="article">
      <CardTitle href={`/articles/${slug}`}>{meta.title}</CardTitle>
      <CardEyebrow as="time" dateTime={meta.date} decorate>
        {formatDate(meta.date)}
      </CardEyebrow>
      <CardDescription>{meta.description}</CardDescription>
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

function Newsletter() {
  return (
    <form
      action="/api/subscription"
      method="POST"
      className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40"
    >
      <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <MailIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Stay up to date</span>
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Get notified when I publish something new, and unsubscribe at any time.
      </p>
      <div className="mt-6 flex">
        {/*  eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label htmlFor="email" className="sr-only">
          Email address field
        </label>
        <input
          id="email"
          type="email"
          name="email"
          placeholder="Email address"
          aria-label="Email address"
          autoComplete="on"
          required
          className="min-w-0 flex-auto appearance-none rounded-md border border-zinc-900/10 bg-white px-3 py-[calc(theme(spacing.2)-1px)] shadow-md shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10 sm:text-sm"
        />
        <Button type="submit" className="ml-4 flex-none">
          Join
        </Button>
      </div>
    </form>
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
            <div className="relative mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-100 dark:ring-0">
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
              sizes="(min-width: 640px) 18rem, 11rem"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

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
          <div className="mt-6 flex gap-6">
            <SocialLink
              href="https://twitter.com/howard86_"
              aria-label="Follow on Twitter"
              icon={TwitterIcon}
            />
            <SocialLink
              href="https://github.com/Howard86/"
              aria-label="Follow on GitHub"
              icon={GitHubIcon}
            />
            <SocialLink
              href="https://www.linkedin.com/in/howard-tai-4b52b086/"
              aria-label="Follow on LinkedIn"
              icon={LinkedInIcon}
            />
            <SocialLink
              href="mailto:howard@howardism.dev"
              aria-label="Contact Howard via email"
              icon={EmailIcon}
            />
            <SocialLink href="/rss/feed.xml" aria-label="Follow on RSS feed" icon={RssIcon} />
          </div>
        </div>
      </Container>
      <Photos />
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16">
            {articles.slice(0, 4).map((article) => (
              <Article key={article.slug} slug={article.slug} meta={article.meta} />
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
