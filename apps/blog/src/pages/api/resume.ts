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
  type SkillSchema,
  resumeSchema,
} from "@/app/profile/resume/schema"
import prisma from "@/services/prisma"

import { authOptions } from "./auth/[...nextauth]"

const router = new RouterBuilder()

const generateStringArray = (items: string) => items.split("\n")

const mapExperienceInput = (experience: ExperienceSchema) => ({
  company: experience.company,
  location: experience.location,
  title: experience.title,
  size: experience.size,
  startDate: new Date(experience.startDate),
  endDate: experience.endDate ? new Date(experience.endDate) : undefined,
  responsibilities: generateStringArray(experience.items),
})

const mapEducationInput = (education: EducationSchema) => ({
  facility: education.facility,
  degree: education.degree,
  location: education.location,
  startDate: new Date(education.startDate),
  endDate: new Date(education.endDate),
  subjects: generateStringArray(education.items),
})

const mapProjectInput = (project: ProjectSchema) => ({
  title: project.title,
  subtitle: project.subtitle,
  descriptions: generateStringArray(project.items),
})

const mapSkillInput = (skill: SkillSchema) => ({
  title: skill.title,
  items: generateStringArray(skill.items),
})

const mapLanguageInput = (language: LanguageSchema) => ({
  name: language.name,
  proficiency: language.proficiency,
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

    for (const project of resume.projects) {
      const { id } = project
      const data = mapProjectInput(project)

      concurrentUpdatePromise.push(
        id && existedIdSet.delete(id)
          ? prisma.resumeProject.update({ where: { id }, data })
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

    for (const skill of resume.skills) {
      const { id } = skill
      const data = mapSkillInput(skill)

      concurrentUpdatePromise.push(
        id && existedIdSet.delete(id)
          ? prisma.resumeSkill.update({ where: { id }, data })
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

    for (const language of resume.languages) {
      const { id } = language
      const data = mapLanguageInput(language)

      concurrentUpdatePromise.push(
        id && existedIdSet.delete(id)
          ? prisma.resumeLanguage.update({ where: { id }, data })
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
        experiences: { createMany: { data: resume.experiences.map(mapExperienceInput) } },
        educations: { createMany: { data: resume.educations.map(mapEducationInput) } },
        projects: { createMany: { data: resume.projects.map(mapProjectInput) } },
        skills: { createMany: { data: resume.skills.map(mapSkillInput) } },
        languages: { createMany: { data: resume.languages.map(mapLanguageInput) } },
      },
    })

    return result.id
  })

export default router.build()
