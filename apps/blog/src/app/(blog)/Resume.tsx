import type { FC } from "react";
import type { SVGProps } from "react-html-props";

import ExternalLink from "../(common)/ExternalLink";
import {
  BriefcaseIcon,
  FstIcon,
  LootexIcon,
  OddleIcon,
  RocafIcon,
} from "../(common)/icons";

interface ResumeTime {
  dateTime: string;
  label: string;
}

interface ResumeEntity {
  company: string;
  end: string | ResumeTime;
  href: string;
  logo: FC<SVGProps>;
  start: string | ResumeTime;
  title: string;
}

const getStringOrValue = (time: string | ResumeTime, key: keyof ResumeTime) =>
  typeof time === "string" ? time : time[key];

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
];

export default function Resume() {
  return (
    <div className="rounded-2xl border border-base-200 p-6">
      <h2 className="flex font-semibold text-sm">
        <BriefcaseIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Work</span>
      </h2>
      <ol className="mt-6 space-y-4">
        {resume.map((role) => (
          <li className="flex gap-4" key={role.title}>
            <div className="relative mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-md ring-1 ring-base-200">
              <role.logo
                aria-label={`${role.company} logo`}
                className="h-7 w-7"
              />
            </div>
            <dl className="flex flex-auto flex-wrap gap-x-2">
              <dt className="sr-only">Company</dt>
              <dd className="w-full flex-none font-medium text-sm">
                <ExternalLink className="link-hover link" href={role.href}>
                  {role.company}
                </ExternalLink>
              </dd>
              <dt className="sr-only">Role</dt>
              <dd className="text-xs">{role.title}</dd>
              <dt className="sr-only">Date</dt>
              {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label provides accessible date range for screen readers */}
              <dd
                aria-label={`${getStringOrValue(role.start, "label")} until ${getStringOrValue(
                  role.end,
                  "label"
                )}`}
                className="ml-auto text-base-content/60 text-xs"
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
  );
}
