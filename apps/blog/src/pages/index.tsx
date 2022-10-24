import type { GetStaticPropsResult } from "next";

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
      <HomeSection />
      <AboutSection data={aboutSection} />
      <ExperienceSection data={experienceSection} />
      <ResourceSection data={resourceSection} />
    </>
  );
}

export const getStaticProps = async (): Promise<GetStaticPropsResult<GetHomePageQuery>> => {
  const props = await cms.GetHomePage();

  return { props };
};
