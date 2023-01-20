"use client"

import { Control, useForm, useWatch } from "react-hook-form"

import { Container } from "@/components/template/Container"

import ResumeForm, {
  DEFAULT_RESUME_FORM,
  ReplaceValueToString,
  ResumeFormFieldValues,
} from "./ResumeForm"
import ResumeTemplate from "./ResumeTemplate"

const getRequiredArray = <T extends { items: string[] }>(sections: ReplaceValueToString<T>[]) =>
  sections.map((section) => ({
    ...section,
    items: section.items.split("\n"),
  })) as T[]

interface ResumeLiveViewProps {
  control: Control<ResumeFormFieldValues>
}

function ResumeLiveView({ control }: ResumeLiveViewProps) {
  const values = useWatch({
    control,
  }) as ResumeFormFieldValues

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
  const { register, control } = useForm<ResumeFormFieldValues>({
    defaultValues: DEFAULT_RESUME_FORM,
  })

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <ResumeForm register={register} control={control} />
      <ResumeLiveView control={control} />
    </Container>
  )
}
