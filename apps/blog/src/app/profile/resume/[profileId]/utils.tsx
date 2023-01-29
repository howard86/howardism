import { redirect } from "next/navigation"
import { unstable_getServerSession } from "next-auth"

import { authOptions } from "@/pages/api/auth/[...nextauth]"
import prisma from "@/services/prisma"
import { generateArrayStrings, generateDateISOString } from "@/services/resume"

import type { ResumeSchema } from "../schema"

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

export const mapResumeToResumeSchema = (resume: RawResume): ResumeSchema => ({
  id: resume.id,
  name: resume.applicant.name,
  address: resume.applicant.address,
  phone: resume.applicant.phone,
  email: resume.applicant.email,
  github: resume.applicant.github,
  website: resume.applicant.website,

  company: resume.company,
  position: resume.position,
  summary: resume.summary,

  experiences: resume.experiences.map((experience) => ({
    id: resume.id,
    company: experience.company,
    location: experience.location,
    title: experience.title,
    size: experience.size,
    startDate: generateDateISOString(experience.startDate),
    endDate: generateDateISOString(experience.endDate),
    items: generateArrayStrings(experience.responsibilities),
  })),

  projects: resume.projects.map((project) => ({
    id: resume.id,
    title: project.title,
    subtitle: project.subtitle,
    items: generateArrayStrings(project.descriptions),
  })),

  educations: resume.educations.map((education) => ({
    id: resume.id,
    facility: education.facility,
    degree: education.degree,
    location: education.location,
    startDate: generateDateISOString(education.startDate),
    endDate: generateDateISOString(education.endDate),
    items: generateArrayStrings(education.subjects),
  })),

  skills: resume.skills.map((skill) => ({
    id: resume.id,
    title: skill.title,
    items: generateArrayStrings(skill.items),
  })),

  languages: resume.languages.map((language) => ({
    id: resume.id,
    name: language.name,
    proficiency: language.proficiency,
  })),
})
