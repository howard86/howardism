import type { MetadataRoute } from "next";

import { isPagesExport } from "@/config/deploy-target";
import { env } from "@/config/env";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    // Crawlers must still reach pages to see the Pages backup's noindex tag.
    ...(isPagesExport
      ? {}
      : {
          sitemap: `${env.NEXT_PUBLIC_DOMAIN_NAME}/sitemap.xml`,
          host: env.NEXT_PUBLIC_DOMAIN_NAME,
        }),
  };
}
