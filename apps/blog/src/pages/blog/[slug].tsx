import React from "react";
import { NextSeo } from "next-seo";
import matter from "gray-matter";
import { join } from "path";
import { readdirSync, readFileSync } from "fs";
import { ParsedUrlQuery } from "querystring";
import { List, Center } from "@chakra-ui/react";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import type { GetStaticProps, GetStaticPaths, NextPage } from "next";

import { MDX_SOURCE_PATH } from "@/constants/mdx";
import { filterNullValue } from "@/utils/filter";
import BlogNavButton from "@/components/blog/BlogNavButton";
import markdown from "@/components/markdown";

interface BlogPostProps {
  mdxSource: MDXRemoteSerializeResult;
  meta: FrontMatter.Meta;
}

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
  const mdxSource = await serialize(content);
  return {
    props: {
      mdxSource,
      meta: filterNullValue(data) as FrontMatter.Meta,
    },
  };
};

const BlogPostPage: NextPage<BlogPostProps> = ({ mdxSource, meta }) => {
  return (
    <>
      <NextSeo title={meta.title} />
      <List display="flex" justifyContent="space-between" mb={[8, 4]}>
        <BlogNavButton title={meta.lastPostTitle} date={meta.lastPostDate} />
        <BlogNavButton title={meta.nextPostTitle} date={meta.nextPostDate} />
      </List>
      <MDXRemote {...mdxSource} components={markdown} />
      <Center>
        <BlogNavButton />
      </Center>
    </>
  );
};

export default BlogPostPage;
