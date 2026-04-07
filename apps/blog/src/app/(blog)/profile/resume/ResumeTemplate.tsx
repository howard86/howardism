import {
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Merriweather } from "next/font/google";

import { Container } from "@/app/(common)/Container";
import { GitHubIcon } from "@/app/(common)/icons";

import { ContactListItem } from "./ContactListItem";
import {
  EducationListItem,
  type EducationListItemProps,
} from "./EducationListItem";
import {
  ExperienceListItem,
  type ExperienceListItemProps,
} from "./ExperienceListItem";
import {
  LanguageListItem,
  type LanguageListItemProps,
} from "./LanguageListItem";
import { ProjectListItem, type ProjectListItemProps } from "./ProjectListItem";
import { SectionTitle } from "./SectionTitle";
import { SkillListItem, type SkillListItemProps } from "./SkillListItem";

const articleFont = Merriweather({
  weight: ["400", "700"],
  style: ["italic", "normal"],
  subsets: ["latin"],
});

export interface ResumeTemplateProps {
  address: string;
  educations: EducationListItemProps[];
  email: string;
  experiences: ExperienceListItemProps[];
  github: string;
  languages: LanguageListItemProps[];
  name: string;
  phone: string;
  projects: ProjectListItemProps[];
  skills: SkillListItemProps[];
  summary: string;
  website: string;
}

// TODO: remove this template
export default function ResumeTemplate({
  name,
  summary,
  address,
  phone,
  email,
  github,
  website,
  experiences,
  projects,
  educations,
  skills,
  languages,
}: ResumeTemplateProps) {
  return (
    <Container className={`mt-6 flex-1 sm:mt-12 ${articleFont.className}`}>
      <article
        className={`mx-auto h-[297mm] w-[210mm] border border-zinc-50 bg-white pt-24 pr-8 pl-12 shadow-md ${articleFont.className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <section>
            <h2 className="font-bold text-4xl">{name}</h2>
            <p className="mt-2 text-xs leading-5">{summary}</p>
          </section>
          <section className="w-40 flex-shrink-0">
            <ul className="text-2xs">
              <ContactListItem Icon={MapPinIcon} text={address} />
              <ContactListItem Icon={DevicePhoneMobileIcon} text={phone} />
              <ContactListItem Icon={EnvelopeIcon} text={email} />
              <ContactListItem Icon={GitHubIcon} text={github} />
              <ContactListItem Icon={GlobeAltIcon} text={website} />
            </ul>
          </section>
        </div>
        <div className="mt-4 flex justify-between gap-2">
          <div className="space-y-4">
            <section>
              <SectionTitle text="Experience" />
              <ul className="space-y-2">
                {experiences.map((experience) => (
                  <ExperienceListItem
                    key={experience.company + experience.title}
                    {...experience}
                  />
                ))}
              </ul>
            </section>
            <section>
              <SectionTitle text="Projects" />
              <ul className="space-y-2">
                {projects.map((project) => (
                  <ProjectListItem key={project.title} {...project} />
                ))}
              </ul>
            </section>
          </div>
          <div className="w-48 flex-shrink-0 space-y-4">
            <section>
              <SectionTitle text="Education" />
              <ul className="space-y-2">
                {educations.map((education) => (
                  <EducationListItem
                    key={education.facility + education.degree}
                    {...education}
                  />
                ))}
              </ul>
            </section>
            <section>
              <SectionTitle text="Skills" />
              <ul className="space-y-1.5">
                {skills.map((skill) => (
                  <SkillListItem key={skill.title} {...skill} />
                ))}
              </ul>
            </section>
            <section>
              <SectionTitle text="Languages" />
              <ul className="">
                {languages.map((language) => (
                  <LanguageListItem key={language.name} {...language} />
                ))}
              </ul>
            </section>
          </div>
        </div>
      </article>
    </Container>
  );
}
