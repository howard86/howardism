import { Card } from "@howardism/ui/components/card";
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
    <Card className="px-6 py-5">
      <div className="mb-4 font-medium font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.16em]">
        Experience
      </div>
      <ol className="m-0 list-none p-0">
        {resume.map((role) => (
          <li
            className="flex items-center gap-2.5 border-border border-b border-dashed py-2.5"
            key={role.company}
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border">
              <role.logo
                aria-label={`${role.company} logo`}
                className="size-[18px]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <ExternalLink
                  className="font-body font-medium text-[13px] text-foreground no-underline"
                  href={role.href}
                >
                  {role.company}
                </ExternalLink>
                {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label provides accessible date range */}
                <span
                  aria-label={`${getStringOrValue(role.start, "label")} until ${getStringOrValue(role.end, "label")}`}
                  className="whitespace-nowrap font-mono text-[10px] text-foreground-subtle tracking-[0.02em]"
                >
                  <time dateTime={getStringOrValue(role.start, "dateTime")}>
                    {getStringOrValue(role.start, "label")}
                  </time>
                  {" — "}
                  <time dateTime={getStringOrValue(role.end, "dateTime")}>
                    {getStringOrValue(role.end, "label")}
                  </time>
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
