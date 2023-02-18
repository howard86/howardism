import ResumeEditor from "../../ResumeEditor"
import { type ResumeProfilePageProps } from "../page"
import { getResumeById, mapResumeToResumeSchema } from "../utils"

export default async function EditResumePage({ params: { profileId } }: ResumeProfilePageProps) {
  const resume = await getResumeById(profileId)

  return <ResumeEditor profileId={profileId} resume={mapResumeToResumeSchema(resume)} />
}
