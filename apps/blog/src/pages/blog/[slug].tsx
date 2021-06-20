import { Center, List } from "@chakra-ui/react";
import type {
  GetStaticPathsResult,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { NextSeo } from "next-seo";
import type { ParsedUrlQuery } from "querystring";
import React from "react";

import BlogNavButton from "@/components/blog/BlogNavButton";
import markdown from "@/components/markdown";
import { fetchBlogPostById, fetchBlogPosts } from "@/services/cms";
import type { BlogPost } from "@/types/blog-post";

interface BlogPostProps {
  mdxSource: MDXRemoteSerializeResult;
  meta: Omit<BlogPost, "article">;
}

interface StaticPaths extends ParsedUrlQuery {
  slug: string;
}

export const getStaticPaths = async (): Promise<GetStaticPathsResult<StaticPaths>> => {
  const posts = await fetchBlogPosts();

  return {
    fallback: false,
    paths: posts.map((post) => ({
      params: {
        slug: post.id.toString(),
      },
    })),
  };
};

export const getStaticProps = async ({
  params,
}: GetStaticPropsContext<StaticPaths>): Promise<GetStaticPropsResult<BlogPostProps>> => {
  const slug = params?.slug;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  const post = await fetchBlogPostById(slug);

  if (!post) {
    return {
      notFound: true,
    };
  }

  const { article, ...meta } = post;

  const mdxSource = await serialize(article);

  return {
    props: {
      mdxSource,
      meta,
    },
  };
};

const BlogPostPage: NextPage<BlogPostProps> = ({ mdxSource, meta }) => {
  return (
    <>
      <NextSeo title={meta.title} />
      <List display="flex" justifyContent="space-between" mb={[8, 4]}>
        <BlogNavButton title="Previous" id={meta.id - 1} />
        <BlogNavButton title="Next" id={meta.id + 1} />
      </List>
      <MDXRemote {...mdxSource} components={markdown} />
      <Center>
        <BlogNavButton title="Back to Home" id={-1} />
      </Center>
    </>
  );
};

export default BlogPostPage;
