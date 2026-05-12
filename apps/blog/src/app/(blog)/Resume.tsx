import type { FC } from "react";
import type { SVGProps } from "react-html-props";

import ExternalLink from "../(common)/ExternalLink";
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
    <div className="hw-card" style={{ padding: "20px 24px" }}>
      <div className="hw-eyebrow" style={{ marginBottom: 16, fontSize: 10 }}>
        Work
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {resume.map((role) => (
          <li
            key={role.title}
            style={{
              borderBottom: "1px solid var(--hw-rule)",
              padding: "10px 0",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid var(--hw-rule)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <role.logo
                aria-label={`${role.company} logo`}
                style={{ width: 18, height: 18 }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <ExternalLink
                  className="hw-body"
                  href={role.href}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--hw-ink)",
                    textDecoration: "none",
                  }}
                >
                  {role.company}
                </ExternalLink>
                {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-label provides accessible date range */}
                <span
                  aria-label={`${getStringOrValue(role.start, "label")} until ${getStringOrValue(role.end, "label")}`}
                  className="hw-mono"
                  style={{
                    fontSize: 10,
                    color: "var(--hw-ink-3)",
                    whiteSpace: "nowrap",
                  }}
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
              <span
                className="hw-mono"
                style={{ fontSize: 11, color: "var(--hw-ink-3)" }}
              >
                {role.title}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
