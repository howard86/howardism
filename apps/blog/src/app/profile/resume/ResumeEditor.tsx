"use client"

import { Control, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Container } from "@/components/template/Container"

import ResumeForm, { DEFAULT_RESUME_FORM, ReplaceValueToString } from "./ResumeForm"
import ResumeTemplate from "./ResumeTemplate"
import { type ResumeSchema, resumeSchema } from "./schema"

const getRequiredArray = <T extends { items: string[] }>(sections: ReplaceValueToString<T>[]) =>
  sections.map((section) => ({
    ...section,
    items: section.items.split("\n"),
  })) as T[]

interface ResumeLiveViewProps {
  control: Control<ResumeSchema>
}

function ResumeLiveView({ control }: ResumeLiveViewProps) {
  const values = useWatch({
    control,
  }) as ResumeSchema

  return (
    // TODO: consider a better way without rerendering
    <ResumeTemplate
      {...values}
      experiences={getRequiredArray(values.experiences)}
      projects={getRequiredArray(values.projects)}
      educations={getRequiredArray(values.educations)}
      skills={getRequiredArray(values.skills)}
    />
  )
}

export default function ResumeEditor() {
  const { register, control, handleSubmit } = useForm<ResumeSchema>({
    mode: "onBlur",
    resolver: zodResolver(resumeSchema),
    defaultValues: DEFAULT_RESUME_FORM,
  })

  // TODO: remove these consoles
  const handleCreate = handleSubmit(
    async (values) => {
      console.log("values :>> ", values)
    },
    (error) => {
      console.log("error :>> ", error)
    }
  )

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <ResumeForm register={register} control={control} onSubmit={handleCreate} />
      <ResumeLiveView control={control} />
    </Container>
  )
}
