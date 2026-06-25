import type { Metadata } from "next";
import Link from "next/link";

import { env } from "@/config/env";
import { PlatePage } from "../_shell/plate-page";
import { DOMAIN_META } from "../articles/domain-meta";
import { getQuizByDomain, getQuizDomains } from "../articles/service";

const LEARN_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/learn`;

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Learn — Howardism",
  description:
    "Active-recall skill trees over the Howardism wiki. Read a concept, pass its quiz to master it, and keep it with spaced review.",
  alternates: { canonical: LEARN_URL },
  openGraph: { url: LEARN_URL },
};

export default function LearnIndexPage() {
  const domains = getQuizDomains().map((domain) => ({
    domain,
    meta: DOMAIN_META[domain],
    count: getQuizByDomain(domain).length,
  }));

  return (
    <PlatePage
      headerChildren={
        <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
          Reading is passive; recall is not. Pick a domain, read its concepts,
          and pass each quiz to master it — then keep what you learned with{" "}
          <Link
            className="text-brand no-underline hover:underline"
            href="/review"
          >
            spaced review
          </Link>
          .
        </p>
      }
      headerData={[["Domains", String(domains.length)]]}
      plate="learn"
      title="Learn the wiki,"
      titleAccent="by recall."
      width="index"
    >
      <ul className="m-0 mt-6 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
        {domains.map(({ domain, meta, count }) => (
          <li key={domain}>
            <Link
              className="block h-full rounded-md border border-border bg-card px-5 py-5 no-underline transition-colors hover:border-[color:var(--card-accent)]"
              href={`/learn/${domain}`}
              style={{ "--card-accent": meta.color } as React.CSSProperties}
            >
              <span
                className="font-mono text-[10.5px] uppercase tracking-[0.18em]"
                style={{ color: meta.color }}
              >
                {count} concepts
              </span>
              <h2 className="mt-2 mb-1 font-display font-medium text-[18px] text-foreground">
                {meta.label}
              </h2>
              <p className="m-0 font-body text-[14px] text-muted-foreground leading-[1.5]">
                {meta.blurb}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </PlatePage>
  );
}
