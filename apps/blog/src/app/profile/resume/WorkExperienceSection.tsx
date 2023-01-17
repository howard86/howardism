"use client"

import { type Control, type UseFormRegister, useFieldArray } from "react-hook-form"
import { XCircleIcon } from "@heroicons/react/20/solid"

import FormInput from "./FormInput"
import FormSectionContainer from "./FormSectionContainer"
import FormTextArea from "./FormTextArea"
import type { ResumeFormFieldValues } from "./ResumeForm"

export const DEFAULT_EXPERIENCE: ResumeFormFieldValues["experiences"][number] = {
  title: "",
  company: "",
  location: "",
  size: "",
  startMonth: "",
  endMonth: "",
  items: "",
}

interface WorkExperienceSectionProps {
  control: Control<ResumeFormFieldValues>
  register: UseFormRegister<ResumeFormFieldValues>
}

export default function WorkExperienceSection({ control, register }: WorkExperienceSectionProps) {
  const { append, remove, fields } = useFieldArray({ control, name: "experiences" })

  const handleAdd = () => {
    append(DEFAULT_EXPERIENCE)
  }

  return (
    <FormSectionContainer
      heading="Work Experience"
      subheading="Related work experience for this position"
    >
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="relative col-span-6 grid grid-cols-6 gap-x-6 gap-y-4 rounded-md border border-zinc-100 p-6 shadow-sm transition-colors focus-within:border-zinc-200 hover:border-zinc-200"
        >
          {fields.length > 1 && (
            <button
              className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"
              type="button"
              onClick={() => {
                remove(index)
              }}
            >
              <XCircleIcon className="h-6 w-6 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
            </button>
          )}
          <FormInput
            className="col-span-6 sm:col-span-3"
            register={register}
            name={`experiences.${index}.company`}
            label="Company Name"
          />
          <FormInput
            className="col-span-6 sm:col-span-3"
            register={register}
            name={`experiences.${index}.title`}
            label="Title"
          />
          <FormInput
            className="col-span-6 sm:col-span-3"
            register={register}
            name={`experiences.${index}.location`}
            label="Location"
          />
          <FormInput
            className="col-span-6 sm:col-span-3"
            register={register}
            name={`experiences.${index}.size`}
            label="Team Size"
            type="number"
          />
          <FormInput
            className="col-span-6 sm:col-span-3"
            register={register}
            name={`experiences.${index}.startMonth`}
            label="Start Date"
            type="date"
          />
          <FormInput
            className="col-span-6 sm:col-span-3"
            register={register}
            name={`experiences.${index}.endMonth`}
            label="End Date"
            type="date"
          />
          <FormTextArea
            className="col-span-6"
            register={register}
            name={`experiences.${index}.items`}
            label="Descriptions"
          />
        </div>
      ))}
      <div className="col-span-6 flex items-center justify-center">
        <button type="button" className="button" onClick={handleAdd}>
          Add More
        </button>
      </div>
    </FormSectionContainer>
  )
}
