import type { FC } from "react"
import type { SVGProps } from "react-html-props"

import FstIcon from "@/components/icons/Fst"
import LootexIcon from "@/components/icons/Lootex"
import OddleIcon from "@/components/icons/Oddle"
import RocafIcon from "@/components/icons/RocafIcon"
import ExternalLink from "@/components/template/ExternalLink"
import { BriefcaseIcon } from "@/components/template/SocialIcons"

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
  {
    company: "ROCAF",
    href: "https://air.mnd.gov.tw/EN/Home/index.aspx",
    title: "Military Service",
    logo: RocafIcon,
    start: "2016",
    end: "2017",
  },
]

export default function Resume() {
  return (
    <div className="rounded-2xl border border-base-200 p-6 ">
      <h2 className="flex text-sm font-semibold">
        <BriefcaseIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Work</span>
      </h2>
      <ol className="mt-6 space-y-4">
        {resume.map((role) => (
          <li key={role.title} className="flex gap-4">
            <div className="relative mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-md ring-1 ring-base-200">
              <role.logo aria-label={`${role.company} logo`} className="h-7 w-7" />
            </div>
            <dl className="flex flex-auto flex-wrap gap-x-2">
              <dt className="sr-only">Company</dt>
              <dd className="w-full flex-none text-sm font-medium">
                <ExternalLink href={role.href} className="link-hover link">
                  {role.company}
                </ExternalLink>
              </dd>
              <dt className="sr-only">Role</dt>
              <dd className="text-xs">{role.title}</dd>
              <dt className="sr-only">Date</dt>
              <dd
                className="ml-auto text-xs text-base-content/60"
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
