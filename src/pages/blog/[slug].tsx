import { GetStaticProps, GetStaticPaths } from "next";
import renderToString from "next-mdx-remote/render-to-string";
import matter from "gray-matter";
import { join } from "path";
import { readdirSync, readFileSync } from "fs";
import { ParsedUrlQuery } from "querystring";

import BlogPost, { BlogPostProps } from "@/containers/BlogPost";
import { MDX_SOURCE_PATH } from "@/constants/mdx";
import { filterNullValue } from "@/utils/filter";

interface StaticPaths extends ParsedUrlQuery {
  slug: string;
}

export const getStaticPaths: GetStaticPaths<StaticPaths> = async () => ({
  fallback: false,
  paths: readdirSync(MDX_SOURCE_PATH).map((fileName) => ({
    params: { slug: fileName.replace(/\.mdx/, "") },
  })),
});

export const getStaticProps: GetStaticProps<BlogPostProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const sourcePath = join(MDX_SOURCE_PATH, `${slug}.mdx`);

  const source = readFileSync(sourcePath, "utf8");
  const { data, content } = matter(source);
  const mdxSource = await renderToString(content);
  return {
    props: {
      mdxSource,
      meta: filterNullValue(data) as FrontMatter.Meta,
    },
  };
};

export default BlogPost;
