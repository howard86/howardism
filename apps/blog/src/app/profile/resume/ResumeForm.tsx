"use client"

import { Fragment } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import {
  CreditCardIcon,
  KeyIcon,
  SquaresPlusIcon,
  UserCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline"
import clsx from "clsx"

import { Container } from "@/components/template/Container"

import FormInput from "./FormInput"
import FormSectionContainer from "./FormSectionContainer"
import FormTextArea from "./FormTextArea"
import { ResumeTemplateProps } from "./ResumeTemplate"

const navigation = [
  { name: "Personal", href: "#", icon: UserCircleIcon, current: true },
  { name: "Application", href: "#", icon: KeyIcon, current: false },
  { name: "Experiences", href: "#", icon: CreditCardIcon, current: false },
  { name: "Education", href: "#", icon: CreditCardIcon, current: false },
  { name: "Projects", href: "#", icon: UserGroupIcon, current: false },
  { name: "Skills", href: "#", icon: SquaresPlusIcon, current: false },
  { name: "Languages", href: "#", icon: SquaresPlusIcon, current: false },
]

export interface ResumeFormFieldValues extends ResumeTemplateProps {
  company: string
  position: string
}

export default function ResumeForm() {
  const { register, control } = useForm<ResumeFormFieldValues>({
    defaultValues: {
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
          company: "",
          location: "",
          title: "",
          size: "",
          startMonth: "",
          endMonth: "",
          items: [""],
        },
      ],

      educations: [
        {
          name: "",
          degree: "",
          startMonth: "",
          endMonth: "",
          items: [""],
        },
      ],

      projects: [
        {
          name: "",
          description: "",
          items: [""],
        },
      ],

      skills: [{ category: "", items: [""] }],

      languages: [{ name: "", level: "" }],
    },
  })
  const experiences = useFieldArray({ control, name: "experiences" })
  const educations = useFieldArray({ control, name: "educations" })
  const projects = useFieldArray({ control, name: "projects" })
  const skills = useFieldArray({ control, name: "skills" })
  const languages = useFieldArray({ control, name: "languages" })

  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
        <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={clsx(
                  item.current
                    ? "bg-gray-50 text-teal-700 hover:bg-white hover:text-teal-700"
                    : "text-gray-900 hover:bg-gray-50 hover:text-gray-900",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                <item.icon
                  className={clsx(
                    item.current
                      ? "text-teal-500 group-hover:text-teal-500"
                      : "text-gray-400 group-hover:text-gray-500",
                    "-ml-1 mr-3 h-6 w-6 flex-shrink-0"
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
          <form action="#" method="POST">
            <div className="shadow sm:overflow-hidden sm:rounded-md">
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
                  rows={2}
                />
              </FormSectionContainer>

              <FormSectionContainer
                heading="Work Experiences"
                subheading="Related work experience for this position"
              >
                {experiences.fields.map((experience, index) => (
                  <Fragment key={experience.id}>
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
                  </Fragment>
                ))}
              </FormSectionContainer>

              <FormSectionContainer heading="Education" subheading="Acedemic background">
                {educations.fields.map((education, index) => (
                  <Fragment key={education.id}>
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
                  </Fragment>
                ))}
              </FormSectionContainer>

              <FormSectionContainer
                heading="Projects"
                subheading="Other side projects that you are willing to reference"
              >
                {projects.fields.map((project, index) => (
                  <Fragment key={project.id}>
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
                      label="description"
                    />
                  </Fragment>
                ))}
              </FormSectionContainer>

              <FormSectionContainer
                heading="Skills"
                subheading="Related skills for applying positions"
              >
                {skills.fields.map((skill, index) => (
                  <Fragment key={skill.id}>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      register={register}
                      name={`skills.${index}.category`}
                      label="Category"
                    />
                  </Fragment>
                ))}
              </FormSectionContainer>

              <FormSectionContainer heading="Languages" subheading="Communication Tools">
                {languages.fields.map((language, index) => (
                  <Fragment key={language.id}>
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
                  </Fragment>
                ))}
              </FormSectionContainer>

              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Container>
  )
}
