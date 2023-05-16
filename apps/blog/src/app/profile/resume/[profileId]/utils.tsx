import type { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/pages/api/auth/[...nextauth]"
import prisma from "@/services/prisma"
import { generateArrayStrings, generateDateISOString } from "@/services/resume"

import type { ResumeSchema } from "../schema"

export async function getResumeById(profileId: string) {
  const session = await getServerSession(authOptions)

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

const convertStringArrayToMarkdownList = (items: Prisma.JsonValue): string =>
  Array.isArray(items) ? items.map((item) => `- ${item}`).join("\n") : ""

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

  experiences: resume.experiences.map((item) => ({
    id: item.id,
    company: item.company,
    companyUrl: item.companyUrl || "",
    companyDescription: item.companyDescription || "",
    location: item.location,
    title: item.title,
    size: item.size || "",
    startDate: generateDateISOString(item.startDate),
    endDate: generateDateISOString(item.endDate),
    items: generateArrayStrings(item.responsibilities),
    description: item.description || convertStringArrayToMarkdownList(item.responsibilities),
  })),

  projects: resume.projects.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    items: generateArrayStrings(item.descriptions),
    ordering: item.ordering,
    description: item.description || convertStringArrayToMarkdownList(item.descriptions),
  })),

  educations: resume.educations.map((item) => ({
    id: item.id,
    facility: item.facility,
    degree: item.degree,
    location: item.location,
    startDate: generateDateISOString(item.startDate),
    endDate: generateDateISOString(item.endDate),
    items: generateArrayStrings(item.subjects),
    description: item.description || convertStringArrayToMarkdownList(item.subjects),
  })),

  skills: resume.skills.map((skill) => ({
    id: skill.id,
    title: skill.title,
    items: generateArrayStrings(skill.items),
    ordering: skill.ordering,
  })),

  languages: resume.languages.map((language) => ({
    id: language.id,
    name: language.name,
    proficiency: language.proficiency,
  })),
})
