"use client"

import type { Control, FieldValues, UseFormRegister } from "react-hook-form"
import { Tab } from "@headlessui/react"
import {
  AcademicCapIcon,
  BriefcaseIcon,
  HomeModernIcon,
  IdentificationIcon,
  InboxStackIcon,
  LanguageIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"
import clsx from "clsx"

import type { EducationListItemProps } from "./EducationListItem"
import type { ExperienceListItemProps } from "./ExperienceListItem"
import FormArraySection from "./FormArraySection"
import FormInput from "./FormInput"
import FormSectionContainer from "./FormSectionContainer"
import FormTextArea from "./FormTextArea"
import type { ProjectListItemProps } from "./ProjectListItem"
import type { ResumeTemplateProps } from "./ResumeTemplate"
import type { SkillListItemProps } from "./SkillListItem"

const navigation = [
  { name: "Personal", icon: IdentificationIcon },
  { name: "Application", icon: HomeModernIcon },
  { name: "Experiences", icon: BriefcaseIcon },
  { name: "Education", icon: AcademicCapIcon },
  { name: "Projects", icon: InboxStackIcon },
  { name: "Skills", icon: WrenchScrewdriverIcon },
  { name: "Languages", icon: LanguageIcon },
]

export type ReplaceValueToString<T extends { items: string[] }> = Omit<T, "items"> & {
  items: string
}

export const DEFAULT_RESUME_FORM: ResumeFormFieldValues = {
  name: "",
  address: "",
  phone: "",
  email: "",
  github: "",
  website: "",

  company: "",
  position: "",
  summary: "",

  experiences: [
    {
      title: "",
      company: "",
      location: "",
      size: "",
      startMonth: "",
      endMonth: "",
      items: "",
    },
  ],

  educations: [
    {
      name: "",
      degree: "",
      startMonth: "",
      endMonth: "",
      items: "",
    },
  ],

  projects: [
    {
      name: "",
      description: "",
      items: "",
    },
  ],

  skills: [{ category: "", items: "" }],

  languages: [{ name: "", level: "" }],
}

export interface ResumeFormFieldValues
  extends Omit<ResumeTemplateProps, "experiences" | "projects" | "educations" | "skills"> {
  company: string
  position: string
  experiences: ReplaceValueToString<ExperienceListItemProps>[]
  projects: ReplaceValueToString<ProjectListItemProps>[]
  educations: ReplaceValueToString<EducationListItemProps>[]
  skills: ReplaceValueToString<SkillListItemProps>[]
}

interface ResumeFormProps<T extends FieldValues> {
  control: Control<T>
  register: UseFormRegister<T>
}

export default function ResumeForm({ control, register }: ResumeFormProps<ResumeFormFieldValues>) {
  return (
    <Tab.Group as="div" vertical className="lg:grid lg:grid-cols-12 lg:gap-x-5">
      <Tab.List as="aside" className="space-y-1 py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0">
        {({ selectedIndex }) => (
          <>
            {navigation.map((item, index) => {
              const selected = selectedIndex === index

              return (
                <Tab
                  key={item.name}
                  className={clsx(
                    selected
                      ? "bg-zinc-100 text-teal-600 hover:bg-zinc-50 hover:text-teal-600"
                      : "text-zinc-900 hover:bg-zinc-100 hover:text-zinc-800",
                    "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium outline-none"
                  )}
                >
                  <item.icon
                    className={clsx(
                      selected
                        ? "text-teal-500 group-hover:text-teal-500"
                        : "text-zinc-400 group-hover:text-zinc-500",
                      "-ml-1 mr-3 h-6 w-6 flex-shrink-0"
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </Tab>
              )
            })}
          </>
        )}
      </Tab.List>

      <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
        <form action="#" method="POST">
          <Tab.Panels as="div" className="shadow sm:overflow-hidden sm:rounded-md">
            <Tab.Panel>
              <FormSectionContainer
                heading="Personal Information"
                subheading="Applicant profile with contact info"
              >
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  register={register}
                  name="name"
                  label="Name"
                />
                <FormInput
                  className="col-span-6"
                  register={register}
                  name="address"
                  label="Address"
                />
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  register={register}
                  name="phone"
                  label="Phone"
                  type="tel"
                  autoComplete="phone"
                />
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  register={register}
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                />
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  register={register}
                  name="github"
                  label="GitHub"
                />
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  register={register}
                  name="website"
                  label="Website"
                  type="url"
                />
              </FormSectionContainer>
            </Tab.Panel>

            <Tab.Panel>
              <FormSectionContainer
                heading="Company Information"
                subheading="Applying company with personal statement"
              >
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  register={register}
                  name="company"
                  label="Company Name"
                />
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  register={register}
                  name="position"
                  label="Applying Position"
                />
                <FormTextArea
                  className="col-span-6"
                  register={register}
                  name="summary"
                  label="Personal Statement"
                />
              </FormSectionContainer>
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                control={control}
                arrayName="experiences"
                arrayValue={DEFAULT_RESUME_FORM.experiences[0]}
                heading="Work Experience"
                subheading="Related work experience for this position"
                renderFormItems={(index: number) => (
                  <>
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
                      label="Description"
                    />
                  </>
                )}
              />
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                control={control}
                arrayName="educations"
                arrayValue={DEFAULT_RESUME_FORM.educations[0]}
                heading="Education"
                subheading="Academic background"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`educations.${index}.name`}
                      label="Name"
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`educations.${index}.degree`}
                      label="Degree"
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`educations.${index}.startMonth`}
                      label="Start Date"
                      type="date"
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`educations.${index}.endMonth`}
                      label="End Date"
                      type="date"
                    />
                    <FormTextArea
                      className="col-span-6"
                      register={register}
                      name={`educations.${index}.items`}
                      label="Description"
                    />
                  </>
                )}
              />
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                control={control}
                arrayName="projects"
                arrayValue={DEFAULT_RESUME_FORM.projects[0]}
                heading="Projects"
                subheading="Other side projects that you are willing to reference"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`projects.${index}.name`}
                      label="Name"
                    />
                    <FormInput
                      className="col-span-6"
                      register={register}
                      name={`projects.${index}.description`}
                      label="Description"
                    />
                    <FormTextArea
                      className="col-span-6"
                      register={register}
                      name={`projects.${index}.items`}
                      label="Description"
                    />
                  </>
                )}
              />
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                control={control}
                arrayName="skills"
                arrayValue={DEFAULT_RESUME_FORM.skills[0]}
                heading="Skills"
                subheading="Related skills for applying positions"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`skills.${index}.category`}
                      label="Category"
                    />
                    <FormTextArea
                      className="col-span-6"
                      register={register}
                      name={`skills.${index}.items`}
                      label="Description"
                    />
                  </>
                )}
              />
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                control={control}
                arrayName="languages"
                arrayValue={DEFAULT_RESUME_FORM.languages[0]}
                heading="Languages"
                subheading="Communication Tools"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`languages.${index}.name`}
                      label="Name"
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`languages.${index}.level`}
                      label="Proficiency"
                    />
                  </>
                )}
              />
            </Tab.Panel>

            <div className="bg-zinc-50 px-4 py-3 text-right sm:px-6">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                Save
              </button>
            </div>
          </Tab.Panels>
        </form>
      </div>
    </Tab.Group>
  )
}
