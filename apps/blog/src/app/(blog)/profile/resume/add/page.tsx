import { requireSessionForPage } from "@/lib/auth";

import ResumeEditor from "../ResumeEditor";

export default async function AddResumeProfilePage() {
  await requireSessionForPage("/profile/resume/add");
  return <ResumeEditor />;
}
