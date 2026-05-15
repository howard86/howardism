import type { MetadataRoute } from "next";

import { env } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${env.NEXT_PUBLIC_DOMAIN_NAME}/sitemap.xml`,
    host: env.NEXT_PUBLIC_DOMAIN_NAME,
  };
}
