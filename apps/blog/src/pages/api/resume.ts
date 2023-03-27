import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  RouterBuilder,
  UnauthorizedException,
} from "next-api-handler"
import { unstable_getServerSession } from "next-auth"

import {
  type EducationSchema,
  type ExperienceSchema,
  type LanguageSchema,
  type ProjectSchema,
  type ResumeSchema,
  resumeSchema,
  type SkillSchema,
} from "@/app/profile/resume/schema"
import { generateStringArray } from "@/app/profile/resume/utils"
import prisma from "@/services/prisma"

import { authOptions } from "./auth/[...nextauth]"

const router = new RouterBuilder()

const mapExperienceInput = (item: ExperienceSchema) => ({
  company: item.company,
  companyUrl: item.companyUrl,
  companyDescription: item.companyDescription,
  location: item.location,
  title: item.title,
  size: item.size,
  startDate: new Date(item.startDate),
  endDate: item.endDate ? new Date(item.endDate) : undefined,
  responsibilities: generateStringArray(item.items),
  description: item.description,
})

const mapEducationInput = (item: EducationSchema) => ({
  facility: item.facility,
  degree: item.degree,
  location: item.location,
  startDate: new Date(item.startDate),
  endDate: new Date(item.endDate),
  subjects: generateStringArray(item.items),
  description: item.description,
})

const mapProjectInput = (item: ProjectSchema, index: number) => ({
  title: item.title,
  subtitle: item.subtitle,
  descriptions: generateStringArray(item.items),
  ordering: item.ordering ?? index,
  description: item.description,
})

const mapSkillInput = (skill: SkillSchema, index: number) => ({
  title: skill.title,
  items: generateStringArray(skill.items),
  ordering: skill.ordering ?? index,
})

const mapLanguageInput = (language: LanguageSchema, index: number) => ({
  name: language.name,
  proficiency: language.proficiency,
  ordering: language.ordering ?? index,
})

const addItemIds = <T extends { id: string }>(set: Set<string>, items: T[]) => {
  for (const item of items) {
    set.add(item.id)
  }
}

type AuthMiddleware = {
  email: string
}

type ResumeParserMiddleware = {
  resume: ResumeSchema
}

router
  .use<AuthMiddleware>(async (req, res) => {
    const session = await unstable_getServerSession(req, res, authOptions)

    if (session === null) throw new ForbiddenException("missing session")

    if (!session?.user?.email) throw new UnauthorizedException("missing email")

    return { email: session.user.email }
  })
  .use<ResumeParserMiddleware, AuthMiddleware>((req) => {
    const body = resumeSchema.safeParse(req.body)

    if (!body.success)
      throw new BadRequestException(`incorrect request body, req.body=${JSON.stringify(req.body)}`)

    if (req.middleware.email !== body.data.email) throw new UnauthorizedException("unmatched email")

    return { resume: body.data }
  })
  .put<string, ResumeParserMiddleware>(async (req) => {
    const { profileId } = req.query

    if (typeof profileId !== "string")
      throw new BadRequestException(
        `incorrect request query, req.query=${JSON.stringify(req.query)}`
      )

    // TODO: extract with unit testing
    const existedResume = await prisma.resumeProfile.findUnique({
      where: { id: profileId },
      include: {
        applicant: true,
        experiences: true,
        educations: true,
        projects: true,
        skills: true,
        languages: true,
      },
    })

    if (!existedResume)
      throw new NotFoundException(
        `cannot find resume with provided profiledId, req.query.profileId=${profileId}`
      )

    const { resume } = req.middleware

    const concurrentUpdatePromise: Promise<unknown>[] = []

    concurrentUpdatePromise.push(
      prisma.resumeProfile.update({
        where: { id: profileId },
        data: {
          company: resume.company,
          position: resume.position,
          summary: resume.summary,
          applicant: {
            update: {
              name: resume.name,
              address: resume.address,
              phone: resume.phone,
              email: resume.email,
              github: resume.github,
              website: resume.website,
            },
          },
        },
      })
    )

    // TODO: refactor repeated logic
    const existedIdSet: Set<string> = new Set()

    addItemIds(existedIdSet, existedResume.experiences)

    for (const experience of resume.experiences) {
      const { id } = experience
      const data = mapExperienceInput(experience)

      concurrentUpdatePromise.push(
        id && existedIdSet.delete(id)
          ? prisma.resumeExperience.update({ where: { id }, data })
          : prisma.resumeExperience.create({ data: { profileId, ...data } })
      )
    }

    if (existedIdSet.size > 0) {
      concurrentUpdatePromise.push(
        prisma.resumeExperience.deleteMany({
          where: {
            id: {
              in: [...existedIdSet],
            },
          },
        })
      )
    }

    existedIdSet.clear()

    addItemIds(existedIdSet, existedResume.educations)

    for (const education of resume.educations) {
      const { id } = education
      const data = mapEducationInput(education)

      concurrentUpdatePromise.push(
        id && existedIdSet.delete(id)
          ? prisma.resumeEducation.update({ where: { id }, data })
          : prisma.resumeEducation.create({ data: { profileId, ...data } })
      )
    }

    if (existedIdSet.size > 0) {
      concurrentUpdatePromise.push(
        prisma.resumeEducation.deleteMany({
          where: {
            id: {
              in: [...existedIdSet],
            },
          },
        })
      )
    }

    existedIdSet.clear()

    addItemIds(existedIdSet, existedResume.projects)

    for (let i = 0; i < resume.projects.length; i++) {
      const project = resume.projects[i]
      const { id } = project
      const data = mapProjectInput(project, i)

      concurrentUpdatePromise.push(
        id && existedIdSet.delete(id)
          ? prisma.resumeProject.update({
              where: { id },
              data: { ...data, ordering: i },
            })
          : prisma.resumeProject.create({ data: { profileId, ...data } })
      )
    }

    if (existedIdSet.size > 0) {
      concurrentUpdatePromise.push(
        prisma.resumeProject.deleteMany({
          where: {
            id: {
              in: [...existedIdSet],
            },
          },
        })
      )
    }

    existedIdSet.clear()

    addItemIds(existedIdSet, existedResume.skills)

    for (let i = 0; i < resume.skills.length; i++) {
      const skill = resume.skills[i]
      const { id } = skill
      const data = mapSkillInput(skill, i)

      concurrentUpdatePromise.push(
        id && existedIdSet.delete(id)
          ? prisma.resumeSkill.update({
              where: { id },
              data: { ...data, ordering: i },
            })
          : prisma.resumeSkill.create({ data: { profileId, ...data } })
      )
    }

    if (existedIdSet.size > 0) {
      concurrentUpdatePromise.push(
        prisma.resumeSkill.deleteMany({
          where: {
            id: {
              in: [...existedIdSet],
            },
          },
        })
      )
    }

    existedIdSet.clear()

    addItemIds(existedIdSet, existedResume.languages)

    for (let i = 0; i < resume.languages.length; i++) {
      const language = resume.languages[i]
      const { id } = language
      const data = mapLanguageInput(language, i)

      concurrentUpdatePromise.push(
        id && existedIdSet.delete(id)
          ? prisma.resumeLanguage.update({
              where: { id },
              data: { ...data, ordering: i },
            })
          : prisma.resumeLanguage.create({ data: { profileId, ...data } })
      )
    }

    if (existedIdSet.size > 0) {
      concurrentUpdatePromise.push(
        prisma.resumeLanguage.deleteMany({
          where: {
            id: {
              in: [...existedIdSet],
            },
          },
        })
      )
    }

    await Promise.all(concurrentUpdatePromise)

    return profileId
  })
  .post<string, ResumeParserMiddleware>(async (req) => {
    const { resume } = req.middleware

    const result = await prisma.resumeProfile.create({
      data: {
        applicant: {
          connectOrCreate: {
            where: { email: resume.email },
            create: {
              name: resume.name,
              address: resume.address,
              phone: resume.phone,
              email: resume.email,
              github: resume.github,
              website: resume.website,
            },
          },
        },
        company: resume.company,
        position: resume.position,
        summary: resume.summary,
        experiences: {
          createMany: { data: resume.experiences.map(mapExperienceInput) },
        },
        educations: {
          createMany: { data: resume.educations.map(mapEducationInput) },
        },
        projects: {
          createMany: { data: resume.projects.map(mapProjectInput) },
        },
        skills: { createMany: { data: resume.skills.map(mapSkillInput) } },
        languages: {
          createMany: { data: resume.languages.map(mapLanguageInput) },
        },
      },
    })

    return result.id
  })

export default router.build()
