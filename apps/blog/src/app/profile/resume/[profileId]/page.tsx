import {
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline"
import { Merriweather } from "@next/font/google"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { unstable_getServerSession } from "next-auth"

import { Container } from "@/components/template/Container"
import { GitHubIcon } from "@/components/template/SocialIcons"
import { authOptions } from "@/pages/api/auth/[...nextauth]"
import prisma from "@/services/prisma"

import { ContactListItem } from "../ContactListItem"
import { EducationListItem } from "../EducationListItem"
import { ExperienceListItem } from "../ExperienceListItem"
import { LanguageListItem } from "../LanguageListItem"
import { ProjectListItem } from "../ProjectListItem"
import { SectionTitle } from "../SectionTitle"
import { SkillListItem } from "../SkillListItem"

const articleFont = Merriweather({
  weight: ["400", "700"],
  style: ["italic", "normal"],
  subsets: ["latin"],
})

export interface ResumeProfilePageProps {
  params: {
    profileId: string
  }
}

const mapPrismaJsonArray = (json: Prisma.JsonValue): string[] =>
  Array.isArray(json) ? (json as string[]) : []

export async function getResumeById(profileId: string) {
  const session = await unstable_getServerSession(authOptions)

  if (!session?.user?.email) redirect("/")

  const resume = await prisma.resumeProfile.findUnique({
    where: { id: profileId },
    include: {
      applicant: true,
      experiences: { orderBy: { startDate: "desc" } },
      projects: { orderBy: { ordering: "asc" } },
      educations: { orderBy: { startDate: "desc" } },
      skills: { orderBy: { ordering: "asc" } },
      languages: { orderBy: { ordering: "asc" } },
    },
  })

  if (!resume || resume.applicant.email !== session.user.email) redirect("/profile")

  return resume
}

export type RawResume = Awaited<ReturnType<typeof getResumeById>>

export default async function ResumeProfilePage({ params: { profileId } }: ResumeProfilePageProps) {
  const resume = await getResumeById(profileId)

  return (
    <Container className={`mt-6 flex-1 sm:mt-12 ${articleFont.className}`}>
      <article className="mx-auto h-[297mm] w-[210mm] border border-zinc-50 bg-white pl-12 pr-8 pt-24 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <section>
            <h2 className="text-4xl font-bold">{resume.applicant.name}</h2>
            <p className="mt-2 text-xs leading-5">{resume.summary}</p>
          </section>
          <section className="w-40 flex-shrink-0">
            <ul className="text-2xs">
              <ContactListItem Icon={MapPinIcon} text={resume.applicant.address} />
              <ContactListItem Icon={DevicePhoneMobileIcon} text={resume.applicant.phone} />
              <ContactListItem Icon={EnvelopeIcon} text={resume.applicant.email} />
              <ContactListItem Icon={GitHubIcon} text={resume.applicant.github} />
              <ContactListItem Icon={GlobeAltIcon} text={resume.applicant.website} />
            </ul>
          </section>
        </div>
        <div className="mt-4 flex justify-between gap-2">
          <div className="space-y-4">
            <section>
              <SectionTitle text="Experience" />
              <ul className="space-y-2">
                {resume.experiences.map((experience) => (
                  <ExperienceListItem
                    key={experience.id}
                    company={experience.company}
                    location={experience.location}
                    title={experience.title}
                    size={experience.size}
                    startDate={experience.startDate.toLocaleDateString()}
                    endDate={experience.endDate?.toLocaleDateString()}
                    items={mapPrismaJsonArray(experience.responsibilities)}
                  />
                ))}
              </ul>
            </section>
            <section>
              <SectionTitle text="Projects" />
              <ul className="space-y-2">
                {resume.projects.map((project) => (
                  <ProjectListItem
                    key={project.id}
                    title={project.title}
                    subtitle={project.subtitle}
                    items={mapPrismaJsonArray(project.descriptions)}
                  />
                ))}
              </ul>
            </section>
          </div>
          <div className="w-48 flex-shrink-0 space-y-4">
            <section>
              <SectionTitle text="Education" />
              <ul className="space-y-2">
                {resume.educations.map((education) => (
                  <EducationListItem
                    key={education.id}
                    facility={education.facility}
                    degree={education.degree}
                    location={education.location}
                    startDate={education.startDate.toLocaleDateString()}
                    endDate={education.endDate.toLocaleDateString()}
                    items={mapPrismaJsonArray(education.subjects)}
                  />
                ))}
              </ul>
            </section>
            <section>
              <SectionTitle text="Skills" />
              <ul className="space-y-1.5">
                {resume.skills.map((skill) => (
                  <SkillListItem
                    key={skill.id}
                    title={skill.title}
                    items={mapPrismaJsonArray(skill.items)}
                  />
                ))}
              </ul>
            </section>
            <section>
              <SectionTitle text="Languages" />
              <ul>
                {resume.languages.map((language) => (
                  <LanguageListItem
                    key={language.id}
                    name={language.name}
                    proficiency={language.proficiency}
                  />
                ))}
              </ul>
            </section>
          </div>
        </div>
      </article>
    </Container>
  )
}
