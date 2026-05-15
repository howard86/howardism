import type { FC } from "react";
import type { SVGProps } from "react-html-props";

import ExternalLink from "../(common)/external-link";
import { FstIcon, LootexIcon, OddleIcon, RocafIcon } from "../(common)/icons";

interface ResumeTime {
  dateTime: string;
  label: string;
}

export interface ResumeEntity {
  company: string;
  end: string | ResumeTime;
  href: string;
  logo: FC<SVGProps>;
  start: string | ResumeTime;
  title: string;
}

const getStringOrValue = (time: string | ResumeTime, key: keyof ResumeTime) =>
  typeof time === "string" ? time : time[key];

export const resume: ResumeEntity[] = [
  {
    company: "Oddle",
    href: "https://oddle.me",
    title: "Fullstack Developer",
    logo: OddleIcon,
    start: "2021",
    end: {
      label: "now",
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
    <section>
      <header className="mb-3 flex items-baseline justify-between border-foreground border-b-[1.5px] pb-2 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]">
        <span>§·Work</span>
        <span>{resume.length} roles</span>
      </header>
      <ol className="m-0 flex list-none flex-col p-0">
        {resume.map((role) => (
          <li
            className="border-border border-b border-dashed last:border-b-0"
            key={role.company}
          >
            <ExternalLink
              className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 py-3 text-foreground no-underline transition-colors hover:text-brand"
              href={role.href}
            >
              <role.logo
                aria-hidden="true"
                className="size-4 self-center fill-current text-foreground-subtle"
              />
              <span className="font-display font-medium text-[15px] leading-[1.2] tracking-[-0.01em] sm:text-[18px]">
                {role.company}
                <span className="ml-2 font-body font-normal text-[11px] text-foreground-subtle tracking-[0.02em]">
                  {role.title}
                </span>
              </span>
              {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label provides an accessible date range for the start/end pair */}
              <span
                aria-label={`${getStringOrValue(role.start, "label")} until ${getStringOrValue(role.end, "label")}`}
                className="whitespace-nowrap font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.14em]"
              >
                <time dateTime={getStringOrValue(role.start, "dateTime")}>
                  {getStringOrValue(role.start, "label")}
                </time>
                <span aria-hidden="true">{" — "}</span>
                <time dateTime={getStringOrValue(role.end, "dateTime")}>
                  {getStringOrValue(role.end, "label")}
                </time>
              </span>
            </ExternalLink>
          </li>
        ))}
      </ol>
    </section>
  );
}
