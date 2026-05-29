import { z } from "zod";

import { WIKI_DOMAINS, WIKI_TAGS } from "./index";

export const SourceRefSchema = z.object({
  title: z.string(),
  url: z.url().optional(),
});

export const ArticleContractSchema = z.object({
  date: z.string(),
  description: z.string(),
  readingTime: z.number(),
  sources: z.array(SourceRefSchema).optional(),
  tag: z.enum(WIKI_TAGS),
  tags: z.array(z.string()).optional(),
  title: z.string(),
  domain: z.enum(WIKI_DOMAINS).optional(),
});
