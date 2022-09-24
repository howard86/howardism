import { Center, List } from "@chakra-ui/react";
import { RouteLink } from "@howardism/components-common";
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

import markdown from "@/components/markdown";
import { fetchBlogPosts } from "@/services/cms";
import type { BlogPost } from "@/types/blog-post";

interface BlogPostProps {
  mdxSource: MDXRemoteSerializeResult;
  meta: Omit<BlogPost, "article">;
  previousPage: PageRouteInfo;
  nextPage: PageRouteInfo;
}

interface PageRouteInfo {
  title: string;
  href: string;
}

interface StaticPaths extends ParsedUrlQuery {
  slug: string;
}

const HOME_ROUTE: PageRouteInfo = {
  title: "Home",
  href: "/",
};

export const getStaticPaths = async (): Promise<GetStaticPathsResult<StaticPaths>> => {
  const posts = await fetchBlogPosts();

  return {
    fallback: false,
    paths: posts.map((post) => ({
      params: {
        slug: post.slug,
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

  // TODO: consider making 3 requests
  const posts = await fetchBlogPosts();

  const foundIndex = posts.findIndex((post) => post.slug === slug);

  if (foundIndex < 0) {
    return {
      notFound: true,
    };
  }

  const { article, ...meta } = posts[foundIndex];

  const mdxSource = await serialize(article);

  return {
    props: {
      mdxSource,
      meta,
      previousPage:
        foundIndex > 0
          ? {
              title: posts[foundIndex - 1].title,
              href: `/blog/${posts[foundIndex - 1].slug}`,
            }
          : HOME_ROUTE,
      nextPage:
        foundIndex < posts.length - 1
          ? {
              title: posts[foundIndex + 1].title,
              href: `/blog/${posts[foundIndex + 1].slug}`,
            }
          : HOME_ROUTE,
    },
  };
};

const BlogPostPage: NextPage<BlogPostProps> = ({ mdxSource, meta, previousPage, nextPage }) => {
  return (
    <>
      <NextSeo title={meta.title} />
      <List display="flex" justifyContent="space-between" mb={[8, 4]}>
        <RouteLink href={previousPage.href}>{previousPage.title}</RouteLink>
        <RouteLink href={nextPage.href}>{nextPage.title}</RouteLink>
      </List>
      <MDXRemote {...mdxSource} components={markdown} />
      <Center>
        <RouteLink href={HOME_ROUTE.href}>{HOME_ROUTE.title}</RouteLink>
      </Center>
    </>
  );
};

export default BlogPostPage;
