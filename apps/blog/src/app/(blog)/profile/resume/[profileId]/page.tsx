import { Container } from "@/app/(common)/Container"

import ResumeDocument from "../ResumeDocument"
import { getResumeById, mapResumeToResumeSchema } from "./utils"

export interface ResumeProfilePageProps {
  params: {
    profileId: string
  }
}

export default async function ResumeProfilePage({ params: { profileId } }: ResumeProfilePageProps) {
  const rawResume = await getResumeById(profileId)

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <ResumeDocument {...mapResumeToResumeSchema(rawResume)} />
    </Container>
  )
}
