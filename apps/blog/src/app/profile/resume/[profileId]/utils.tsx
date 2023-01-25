import { redirect } from "next/navigation"
import { unstable_getServerSession } from "next-auth"

import { authOptions } from "@/pages/api/auth/[...nextauth]"
import prisma from "@/services/prisma"

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
