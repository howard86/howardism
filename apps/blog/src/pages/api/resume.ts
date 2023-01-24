import {
  BadRequestException,
  ForbiddenException,
  RouterBuilder,
  UnauthorizedException,
} from "next-api-handler"
import { unstable_getServerSession } from "next-auth"

import { resumeSchema } from "@/app/profile/resume/schema"
import prisma from "@/services/prisma"

import { authOptions } from "./auth/[...nextauth]"

const router = new RouterBuilder()

type AuthMiddleware = {
  email: string
}

const generateStringArray = (items: string) => items.split("\n")
const generateDateTime = (dateString: string) => (dateString ? new Date(dateString) : "")

router
  .use<AuthMiddleware>(async (req, res) => {
    const session = await unstable_getServerSession(req, res, authOptions)

    if (session === null) throw new ForbiddenException("missing session")

    if (!session?.user?.email) throw new UnauthorizedException("missing email")

    if (session.user.email !== req.body.email) throw new UnauthorizedException("unmatched email")

    return { email: session.user.email }
  })
  .post<string, AuthMiddleware>(async (req) => {
    const body = resumeSchema.safeParse(req.body)

    if (!body.success)
      throw new BadRequestException(`incorrect request body, req.body=${JSON.stringify(req.body)}`)

    // TODO: remove data duplication by further normalisation
    const result = await prisma.resumeProfile.create({
      data: {
        applicant: {
          connectOrCreate: {
            where: {
              email: req.middleware.email,
            },
            create: {
              name: body.data.name,
              address: body.data.address,
              phone: body.data.phone,
              email: body.data.email,
              github: body.data.github,
              website: body.data.website,
            },
          },
        },
        company: body.data.company,
        position: body.data.position,
        summary: body.data.summary,
        experiences: {
          createMany: {
            data: body.data.experiences.map((experience) => ({
              company: experience.company,
              location: experience.location,
              title: experience.title,
              size: experience.size,
              startDate: generateDateTime(experience.startDate),
              endDate: generateDateTime(experience.endDate),
              responsibilities: generateStringArray(experience.items),
            })),
          },
        },
        educations: {
          createMany: {
            data: body.data.educations.map((education) => ({
              facility: education.facility,
              degree: education.degree,
              location: education.location,
              startDate: generateDateTime(education.startDate),
              endDate: generateDateTime(education.endDate),
              subjects: generateStringArray(education.items),
            })),
          },
        },
        projects: {
          createMany: {
            data: body.data.projects.map((project) => ({
              title: project.title,
              subtitle: project.subtitle,
              descriptions: generateStringArray(project.items),
            })),
          },
        },
        skills: {
          createMany: {
            data: body.data.skills.map((project) => ({
              title: project.title,
              items: generateStringArray(project.items),
            })),
          },
        },
        languages: {
          createMany: {
            data: body.data.languages.map((language) => ({
              name: language.name,
              proficiency: language.proficiency,
            })),
          },
        },
      },
    })

    return result.id
  })

export default router.build()
