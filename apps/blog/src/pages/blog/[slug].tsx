import { Center, List } from "@chakra-ui/react";
import { readdirSync, readFileSync } from "fs";
import matter from "gray-matter";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { NextSeo } from "next-seo";
import { join } from "path";
import { ParsedUrlQuery } from "querystring";
import React from "react";

import BlogNavButton from "@/components/blog/BlogNavButton";
import markdown from "@/components/markdown";
import { MDX_SOURCE_PATH } from "@/constants/mdx";
import { filterNullValue } from "@/utils/filter";

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
