"use client"

import { Control, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { SuccessApiResponse } from "next-api-handler"

import { Container } from "@/components/template/Container"

import ResumeDocument from "./ResumeDocument"
import ResumeForm, { DEFAULT_RESUME_FORM } from "./ResumeForm"
import { type ResumeSchema, resumeSchema } from "./schema"

interface ResumeLiveViewProps {
  control: Control<ResumeSchema>
}

function ResumeLiveView({ control }: ResumeLiveViewProps) {
  const values = useWatch({
    control,
  }) as ResumeSchema

  return (
    // TODO: replace with other preview layout
    <section className="mt-20">
      <ResumeDocument {...values} />
    </section>
  )
}

interface ResumeEditorProps {
  profileId?: string
  resume?: ResumeSchema
}

export default function ResumeEditor({
  profileId,
  resume = DEFAULT_RESUME_FORM,
}: ResumeEditorProps) {
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResumeSchema>({
    mode: "onBlur",
    resolver: zodResolver(resumeSchema),
    defaultValues: resume,
  })

  // TODO: add error handling
  const handleCreate = handleSubmit(
    async (values) => {
      const response = await fetch(
        profileId ? `/api/resume?profileId=${profileId}` : "/api/resume",
        {
          method: profileId ? "PUT" : "POST",
          body: JSON.stringify(values),
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const result = (await response.json()) as SuccessApiResponse<string>

      if (result.success) {
        router.push(`/profile/resume/${result.data}`)
      }
    },
    (error) => {
      console.log("error :>> ", error)
    }
  )

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <ResumeForm register={register} control={control} onSubmit={handleCreate} errors={errors} />
      <ResumeLiveView control={control} />
    </Container>
  )
}
