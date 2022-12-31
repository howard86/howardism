import { domMax, LazyMotion } from "framer-motion";
import type { GetStaticPropsResult } from "next";

import Cursor from "@/components/animations/Cursor";
import Layout from "@/components/layout/Layout";
import AboutSection from "@/components/sections/AboutSection";
import ExperienceSection from "@/components/sections/ExprienceSection";
import HomeSection from "@/components/sections/HomeSection";
import ResourceSection from "@/components/sections/ResourceSection";
import cms from "@/services/cms";
import { GetHomePageQuery } from "@/services/query.generated";

export default function Home({
  aboutSection,
  experienceSection,
  resourceSection,
}: GetHomePageQuery): JSX.Element {
  return (
    <>
      <div className="fixed inset-0 flex justify-center sm:px-8">
        <div className="flex w-full max-w-7xl lg:px-8">
          <div className="w-full bg-white ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-300/20" />
        </div>
      </div>
      <LazyMotion features={domMax} strict>
        <Layout>
          <HomeSection />
          <AboutSection data={aboutSection} />
          <ExperienceSection data={experienceSection} />
          <ResourceSection data={resourceSection} />
        </Layout>
        <Cursor />
      </LazyMotion>
    </>
  );
}

export const getStaticProps = async (): Promise<GetStaticPropsResult<GetHomePageQuery>> => {
  const props = await cms.GetHomePage();

  return { props };
};
