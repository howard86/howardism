import { z } from "zod";

import { WIKI_TAGS, WIKI_TOPICS } from "./index";

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
  topic: z.enum(WIKI_TOPICS).optional(),
});
