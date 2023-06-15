import ResumeEditor from "../../ResumeEditor"
import { type ResumeProfilePageProps } from "../page"
import { getResumeById, mapResumeToResumeSchema } from "../utils"

export default async function CloneResumePage({ params: { profileId } }: ResumeProfilePageProps) {
  const resume = await getResumeById(profileId)

  return <ResumeEditor resume={mapResumeToResumeSchema(resume)} />
}
