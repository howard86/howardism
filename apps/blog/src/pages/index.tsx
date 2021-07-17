import type { GetStaticProps } from "next";

import Home, { HomeProps } from "@/components/template/Home";
import { fetchBlogPosts } from "@/services/cms";

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const posts = await fetchBlogPosts();

  return {
    props: {
      posts: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        description: post.description,
        date: post.displayDate || post.created_at,
        // TODO: add tags from cms
        tags: [],
      })),
    },
  };
};

export default Home;
