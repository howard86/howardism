import { requireSessionForPage } from "@/lib/auth";

import ResumeEditor from "../../ResumeEditor";
import type { ResumeProfilePageProps } from "../page";
import { getResumeById, mapResumeToResumeSchema } from "../utils";

export default async function EditResumePage({
  params,
}: ResumeProfilePageProps) {
  const { profileId } = await params;
  await requireSessionForPage(`/profile/resume/${profileId}/edit`);
  const resume = await getResumeById(profileId);

  return (
    <ResumeEditor
      profileId={profileId}
      resume={mapResumeToResumeSchema(resume)}
    />
  );
}
