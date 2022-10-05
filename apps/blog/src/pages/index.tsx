import AboutSection from "@/components/sections/AboutSection";
import ExperienceSection from "@/components/sections/ExprienceSection";
import HomeSection from "@/components/sections/HomeSection";
import ResourceSection from "@/components/sections/ResourceSection";

export default function Home(): JSX.Element {
  return (
    <>
      <HomeSection />
      <AboutSection />
      <ExperienceSection />
      <ResourceSection />
    </>
  );
}
