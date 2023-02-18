import clsx from "clsx"
import Link from "next/link"
import { useRouter } from "next/router"
import { ChangeEvent } from "react"
import type { IconType } from "react-icons"
import { FiPackage } from "react-icons/fi"
import type { DeepPartial, DeepRequired } from "ts-essentials"

import { SectionId } from "@/constants/nav"
import { GetHomePageQuery } from "@/services/query.generated"
import { formatMonth } from "@/utils/time"

import SectionWrapper from "./SectionWrapper"

interface ExperienceCardProps {
  title: string
  description: string
  companyName: string
  // TODO: replace with Date/number
  startDate: string
  endDate: string
  introduction: string
}

function ExperienceCard({
  title,
  description,
  companyName,
  startDate,
  endDate = "Present",
}: Partial<ExperienceCardProps>) {
  return (
    <div className="rounded-md border border-slate-50 p-4 shadow-sm dark:text-white">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
      <span className="text-zinc-600 dark:text-zinc-400">
        {formatMonth(startDate)} - {endDate ? formatMonth(endDate) : "Present"}
      </span>
      <hr className="my-2 border-zinc-100" />
      <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-0.5 text-sm font-medium text-gray-800">
        {companyName}
      </span>
    </div>
  )
}

interface ProjectCardProps {
  title: string
  description: string
  tags: ProjectTagType[]
}

type ProjectTagType = DeepPartial<
  DeepRequired<GetHomePageQuery>["experienceSection"]["data"]["attributes"]["side_projects"]["data"][number]["attributes"]["tech_tools"]["data"][number]
>

function ProjectCard({ title, description, tags }: Partial<ProjectCardProps>) {
  return (
    <div className="flex flex-col rounded-md border border-slate-50 p-2 shadow-sm dark:text-white/90 md:p-4">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
      <div className="mt-4 flex flex-1 flex-wrap items-end gap-1">
        {tags?.map((tag) => (
          <span key={tag.id} className="text-teal-700">
            #{tag.attributes?.name}
          </span>
        ))}
      </div>
    </div>
  )
}

interface ToolCardProps {
  title: string
  description: string
  Icon?: IconType
}

function ToolCard({ title, description, Icon = FiPackage }: Partial<ToolCardProps>) {
  return (
    <div className="flex items-center gap-4 rounded-md border border-slate-50 p-2 shadow-sm dark:text-white/90 md:p-4">
      <Icon className="flex-shrink-0 text-3xl text-zinc-800 dark:text-zinc-300" />
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  )
}

interface ExperienceSectionProps {
  data: GetHomePageQuery["experienceSection"]
}

type ExperienceTab = {
  name: string
  query: string
  key: ExperienceKey
}

type ExperienceKey = Extract<
  keyof DeepRequired<GetHomePageQuery>["experienceSection"]["data"]["attributes"],
  "side_projects" | "work_experiences" | "tech_tools"
>

const TABS: ExperienceTab[] = [
  { name: "Projects", query: "projects", key: "side_projects" },
  { name: "Work", query: "work", key: "work_experiences" },
  { name: "Tools", query: "tools", key: "tech_tools" },
]

const DEFAULT_TAB_VALUE = TABS[0].query

export default function ExperienceSection({ data }: ExperienceSectionProps) {
  const router = useRouter()
  const tabValue = typeof router.query.exp === "string" ? router.query.exp : DEFAULT_TAB_VALUE

  const handleRedirect = (event: ChangeEvent<HTMLSelectElement>) => {
    router.push({ pathname: "/", query: { exp: event.target.value } }, undefined, {
      scroll: false,
      shallow: true,
    })
  }

  return (
    <SectionWrapper
      id={SectionId.Experience}
      tag="experience"
      title={data?.data?.attributes?.section?.title}
      description={data?.data?.attributes?.section?.description}
    >
      <div className="sm:hidden">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 focus:border-teal-500 focus:ring-teal-500"
          onChange={handleRedirect}
          defaultValue={tabValue}
        >
          {TABS.map((tab) => (
            <option key={tab.name} value={tab.query}>
              {tab.name}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {TABS.map((tab) => {
              const isCurrent = tabValue === tab.query

              return (
                <Link
                  key={tab.name}
                  href={{ pathname: "/", query: { exp: tab.query } }}
                  scroll={false}
                  shallow
                  className={clsx(
                    isCurrent
                      ? "border-teal-500 text-teal-600"
                      : "border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700",
                    "flex whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {tab.name}
                  <span
                    className={clsx(
                      isCurrent ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-900",
                      "ml-3 hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block"
                    )}
                  >
                    {data?.data?.attributes?.[tab.key]?.data.length}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      <div className="mt-4">
        <div role="tabpanel" className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {tabValue === TABS[0].query &&
            data?.data?.attributes?.side_projects?.data.map((item) => (
              <ProjectCard
                key={item.id}
                title={item.attributes?.name}
                description={item.attributes?.description}
                tags={item.attributes?.tech_tools?.data}
              />
            ))}
        </div>
        <div role="tabpanel" className="grid grid-cols-2 gap-4">
          {tabValue === TABS[1].query &&
            data?.data?.attributes?.work_experiences?.data.map((item) => (
              <ExperienceCard
                key={item.id}
                title={item.attributes?.job_title}
                description={item.attributes?.job_subtitle}
                companyName={item.attributes?.company_name}
                startDate={item.attributes?.start_date}
                endDate={item.attributes?.end_date}
                // TODO: add introduction
              />
            ))}
        </div>
        <div role="tabpanel" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {tabValue === TABS[2].query &&
            data?.data?.attributes?.tech_tools?.data.map((item) => (
              <ToolCard
                key={item.id}
                title={item.attributes?.name}
                description={item.attributes?.description}
              />
            ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
