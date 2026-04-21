import { requireSessionForPage } from "@/lib/auth";

import ResumeEditor from "../../ResumeEditor";
import type { ResumeProfilePageProps } from "../page";
import { getResumeById, mapResumeToResumeSchema } from "../utils";

export default async function CloneResumePage({
  params,
}: ResumeProfilePageProps) {
  const { profileId } = await params;
  await requireSessionForPage(`/profile/resume/${profileId}/clone`);
  const resume = await getResumeById(profileId);

  return <ResumeEditor resume={mapResumeToResumeSchema(resume)} />;
}
