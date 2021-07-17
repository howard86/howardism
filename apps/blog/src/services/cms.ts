import config from "@/config";
import type { BlogPost } from "@/types/blog-post";

const envCheck = () => {
  if (!config.cmsApiEndpoint) {
    throw new Error("env CMS_API_ENDPOINT not found");
  }
};

export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  envCheck();

  const response = await fetch(`${config.cmsApiEndpoint}/blog-posts?_sort=id:desc`);
  const posts = await response.json();

  return posts;
};

export const fetchBlogPostById = async (id: string): Promise<BlogPost | null> => {
  envCheck();

  const response = await fetch(`${config.cmsApiEndpoint}/blog-posts/${id}`);
  if (response.status !== 200) {
    return null;
  }

  return response.json();
};

export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  envCheck();

  const response = await fetch(`${config.cmsApiEndpoint}/blog-posts?slug=${slug}`);
  if (response.status !== 200) {
    return null;
  }

  const results = (await response.json()) as BlogPost[];

  return results.length > 0 ? results[0] : null;
};
