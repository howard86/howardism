import { Merriweather } from "@next/font/google"

import { Container } from "@/components/template/Container"

import { ContactListItem, ContactListItemProps } from "./ContactListItem"
import { EducationListItem, EducationListItemProps } from "./EducationListItem"
import { ExperienceListItem, ExperienceListItemProps } from "./ExperienceListItem"
import { LanguageListItem, LanguageListItemProps } from "./LanguageListItem"
import { ProjectListItem, ProjectListItemProps } from "./ProjectListItem"
import { SectionTitle } from "./SectionTitle"
import { SkillListItem, SkillListItemProps } from "./SkillListItem"

const articleFont = Merriweather({
  weight: ["400", "700"],
  style: ["italic", "normal"],
})

interface ResumeTemplateProps {
  name: string
  summary: string
  contacts: ContactListItemProps[]
  experiences: ExperienceListItemProps[]
  projects: ProjectListItemProps[]
  educations: EducationListItemProps[]
  skills: SkillListItemProps[]
  languages: LanguageListItemProps[]
}

export default function ResumeTemplate({
  name,
  summary,
  contacts,
  experiences,
  projects,
  educations,
  skills,
  languages,
}: ResumeTemplateProps) {
  return (
    <Container className={`mt-6 flex-1 sm:mt-12 ${articleFont.className}`}>
      <article
        className={`mx-auto h-[297mm] w-[210mm] border border-zinc-50 bg-white pl-12 pr-8 pt-24 shadow-md ${articleFont.className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <section>
            <h2 className="text-4xl font-bold">{name}</h2>
            <p className="mt-2 text-xs leading-5">{summary}</p>
          </section>
          <section className="w-40 flex-shrink-0">
            <ul className="text-2xs">
              {contacts.map((contact) => (
                <ContactListItem key={contact.text} {...contact} />
              ))}
            </ul>
          </section>
        </div>
        <div className="mt-4 flex justify-between gap-2">
          <div className="space-y-4">
            <section>
              <SectionTitle text="Experience" />
              <ul className="space-y-2">
                {experiences.map((experience) => (
                  <ExperienceListItem key={experience.company + experience.title} {...experience} />
                ))}
              </ul>
            </section>
            <section>
              <SectionTitle text="Projects" />
              <ul className="space-y-2">
                {projects.map((project) => (
                  <ProjectListItem key={project.name} {...project} />
                ))}
              </ul>
            </section>
          </div>
          <div className="w-48 flex-shrink-0 space-y-4">
            <section>
              <SectionTitle text="Education" />
              <ul className="space-y-2">
                {educations.map((education) => (
                  <EducationListItem key={education.name + education.degree} {...education} />
                ))}
              </ul>
            </section>
            <section>
              <SectionTitle text="Skills" />
              <ul className="space-y-1.5">
                {skills.map((skill) => (
                  <SkillListItem key={skill.category} {...skill} />
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
  )
}
