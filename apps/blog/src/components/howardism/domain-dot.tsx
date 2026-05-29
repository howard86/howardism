import { DOMAIN_META } from "@/app/(blog)/articles/domain-meta";
import type { ArticleDomain } from "@/app/(blog)/articles/service";

interface DomainDotProps {
  domain: ArticleDomain;
  size?: number;
}

/** Small color-coded dot marking an article's knowledge domain. */
export function DomainDot({ domain, size = 7 }: DomainDotProps) {
  return (
    <span
      aria-hidden="true"
      className="mr-2 inline-block shrink-0 rounded-full align-middle"
      style={{
        background: DOMAIN_META[domain].color,
        height: size,
        width: size,
      }}
    />
  );
}
