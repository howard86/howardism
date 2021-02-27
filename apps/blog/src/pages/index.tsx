import { GetStaticProps } from "next";
import matter from "gray-matter";
import path from "path";
import fs from "fs";

import { MDX_SOURCE_PATH } from "@/constants/mdx";
import Home, { HomeProps } from "@/containers/Home";

const MAX_POSTS_PER_PAGE = 5;

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const postsMeta = fs
    .readdirSync(MDX_SOURCE_PATH)
    .map((fileName) => {
      const content = fs.readFileSync(path.join(MDX_SOURCE_PATH, fileName), "utf8");
      return matter(content).data as FrontMatter.Meta;
    })
    .sort((a, b) => (Date.parse(a.date) < Date.parse(b.date) ? 1 : -1))
    .slice(0, MAX_POSTS_PER_PAGE);

  return {
    props: { postsMeta },
  };
};

export default Home;
