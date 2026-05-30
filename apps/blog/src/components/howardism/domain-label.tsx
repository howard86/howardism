import { DOMAIN_META } from "@/app/(blog)/articles/domain-meta";
import type { ArticleDomain } from "@/app/(blog)/articles/service";

import { DomainDot } from "./domain-dot";

interface DomainLabelProps {
  domain: ArticleDomain;
  size?: number;
}

/** A domain's color dot followed by its label — the standard inline marker. */
export function DomainLabel({ domain, size = 6 }: DomainLabelProps) {
  return (
    <>
      <DomainDot domain={domain} size={size} />
      {DOMAIN_META[domain].label}
    </>
  );
}
