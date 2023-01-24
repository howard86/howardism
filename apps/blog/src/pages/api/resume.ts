import {
  BadRequestException,
  ForbiddenException,
  RouterBuilder,
  UnauthorizedException,
} from "next-api-handler"
import { unstable_getServerSession } from "next-auth"

import { type ResumeSchema, resumeSchema } from "@/app/profile/resume/schema"
import prisma from "@/services/prisma"

import { authOptions } from "./auth/[...nextauth]"

const router = new RouterBuilder()

const generateStringArray = (items: string) => items.split("\n")
const generateOptionalDateTime = (dateString: string) =>
  dateString ? new Date(dateString) : undefined

type ResumeInput = Parameters<typeof prisma["resumeProfile"]["create"]>[0]["data"]

// TODO: remove data duplication by further normalisation
const mapToResumeInput = (resume: ResumeSchema): ResumeInput => ({
  applicant: {
    connectOrCreate: {
      where: {
        email: resume.email,
      },
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
    createMany: {
      data: resume.experiences.map((experience) => ({
        company: experience.company,
        location: experience.location,
        title: experience.title,
        size: experience.size,
        startDate: new Date(experience.startDate),
        endDate: generateOptionalDateTime(experience.endDate),
        responsibilities: generateStringArray(experience.items),
      })),
    },
  },
  educations: {
    createMany: {
      data: resume.educations.map((education) => ({
        facility: education.facility,
        degree: education.degree,
        location: education.location,
        startDate: new Date(education.startDate),
        endDate: new Date(education.endDate),
        subjects: generateStringArray(education.items),
      })),
    },
  },
  projects: {
    createMany: {
      data: resume.projects.map((project) => ({
        title: project.title,
        subtitle: project.subtitle,
        descriptions: generateStringArray(project.items),
      })),
    },
  },
  skills: {
    createMany: {
      data: resume.skills.map((project) => ({
        title: project.title,
        items: generateStringArray(project.items),
      })),
    },
  },
  languages: {
    createMany: {
      data: resume.languages.map((language) => ({
        name: language.name,
        proficiency: language.proficiency,
      })),
    },
  },
})

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

    const result = await prisma.resumeProfile.update({
      where: {
        id: profileId,
      },
      data: mapToResumeInput(req.middleware.resume),
    })

    return result.id
  })
  .post<string, ResumeParserMiddleware>(async (req) => {
    const result = await prisma.resumeProfile.create({
      data: mapToResumeInput(req.middleware.resume),
    })

    return result.id
  })

export default router.build()
