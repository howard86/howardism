import config from "@/config";
import type { BlogPost } from "@/types/blog-post";

export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  if (!config.cmsApiEndpoint) {
    throw new Error("env CMS_API_ENDPOINT not found");
  }

  const response = await fetch(`${config.cmsApiEndpoint}/blog-posts?_sort=id`);
  const posts = await response.json();

  return posts;
};

export const fetchBlogPostById = async (id: string): Promise<BlogPost | null> => {
  if (!config.cmsApiEndpoint) {
    throw new Error("env CMS_API_ENDPOINT not found");
  }

  const response = await fetch(`${config.cmsApiEndpoint}/blog-posts/${id}`);
  if (response.status !== 200) {
    return null;
  }

  return response.json();
};
