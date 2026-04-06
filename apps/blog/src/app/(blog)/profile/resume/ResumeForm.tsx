"use client";

import { Tab } from "@headlessui/react";
import {
  AcademicCapIcon,
  BriefcaseIcon,
  HomeModernIcon,
  IdentificationIcon,
  InboxStackIcon,
  LanguageIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { FormEvent } from "react";
import type {
  Control,
  FieldErrors,
  FieldValues,
  UseFormRegister,
} from "react-hook-form";

import FormInput from "@/app/(common)/FormInput";

import FormArraySection from "./FormArraySection";
import FormSectionContainer from "./FormSectionContainer";
import FormTextArea from "./FormTextArea";
import type { ResumeSchema } from "./schema";

const navigation = [
  { name: "Personal", icon: IdentificationIcon },
  { name: "Application", icon: HomeModernIcon },
  { name: "Experiences", icon: BriefcaseIcon },
  { name: "Education", icon: AcademicCapIcon },
  { name: "Projects", icon: InboxStackIcon },
  { name: "Skills", icon: WrenchScrewdriverIcon },
  { name: "Languages", icon: LanguageIcon },
];

export type ReplaceValueToString<T extends { items: string[] }> = Omit<
  T,
  "items"
> & {
  items: string;
};

export const DEFAULT_RESUME_FORM: ResumeSchema = {
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
      startDate: "2023-01-01",
      endDate: "",
      items: "",
      companyUrl: "",
      companyDescription: "",
      description: "",
    },
  ],

  educations: [
    {
      facility: "",
      degree: "",
      location: "",
      startDate: "",
      endDate: "",
      items: "",
      description: "",
    },
  ],

  projects: [
    {
      title: "",
      subtitle: "",
      items: "",
      description: "",
    },
  ],

  skills: [{ title: "", items: "" }],

  languages: [{ name: "", proficiency: "" }],
};

interface ResumeFormProps<T extends FieldValues> {
  control: Control<T>;
  errors: FieldErrors<T>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  register: UseFormRegister<T>;
}

export default function ResumeForm({
  control,
  register,
  errors,
  onSubmit,
}: ResumeFormProps<ResumeSchema>) {
  return (
    <Tab.Group as="div" className="lg:grid lg:grid-cols-12 lg:gap-x-5" vertical>
      <Tab.List
        as="aside"
        className="space-y-1 px-2 py-6 sm:px-6 lg:col-span-3 lg:px-0 lg:py-0"
      >
        {({ selectedIndex }) => (
          <>
            {navigation.map((item, index) => {
              const selected = selectedIndex === index;

              return (
                <Tab
                  className={clsx(
                    selected
                      ? "bg-base-200 text-primary hover:bg-base-300 hover:text-primary-focus"
                      : "text-base-content hover:bg-base-200 hover:text-primary",
                    "group flex w-full items-center rounded-md px-3 py-2 font-medium text-sm outline-none transition-colors"
                  )}
                  key={item.name}
                >
                  <item.icon
                    aria-hidden="true"
                    className={clsx(
                      selected
                        ? "group-hover:text-primary-focus"
                        : "group-hover:text-primary",
                      "mr-3 -ml-1 w-6"
                    )}
                  />
                  <span className="truncate">{item.name}</span>
                </Tab>
              );
            })}
          </>
        )}
      </Tab.List>

      <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
        <form onSubmit={onSubmit}>
          <Tab.Panels
            as="div"
            className="border border-base-content/10 shadow-sm sm:overflow-hidden sm:rounded-md"
          >
            <Tab.Panel>
              <FormSectionContainer
                heading="Personal Information"
                subheading="Applicant profile with contact info"
              >
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  errors={errors}
                  label="Name"
                  name="name"
                  register={register}
                />
                <FormInput
                  className="col-span-6"
                  errors={errors}
                  label="Address"
                  name="address"
                  register={register}
                />
                <FormInput
                  autoComplete="phone"
                  className="col-span-6 sm:col-span-3"
                  errors={errors}
                  label="Phone"
                  name="phone"
                  register={register}
                  type="tel"
                />
                <FormInput
                  autoComplete="email"
                  className="col-span-6 sm:col-span-3"
                  errors={errors}
                  label="Email"
                  name="email"
                  register={register}
                  type="email"
                />
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  errors={errors}
                  label="GitHub"
                  name="github"
                  register={register}
                />
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  errors={errors}
                  label="Website"
                  name="website"
                  register={register}
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
                  errors={errors}
                  label="Company Name"
                  name="company"
                  register={register}
                />
                <FormInput
                  className="col-span-6 sm:col-span-3"
                  errors={errors}
                  label="Applying Position"
                  name="position"
                  register={register}
                />
                <FormTextArea
                  className="col-span-6"
                  errors={errors}
                  label="Personal Statement"
                  name="summary"
                  register={register}
                />
              </FormSectionContainer>
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                arrayName="experiences"
                arrayValue={DEFAULT_RESUME_FORM.experiences[0]}
                control={control}
                heading="Work Experience"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Company Name"
                      name={`experiences.${index}.company`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Company Description"
                      name={`experiences.${index}.companyDescription`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Company Url"
                      name={`experiences.${index}.companyUrl`}
                      register={register}
                      type="url"
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Title"
                      name={`experiences.${index}.title`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Location"
                      name={`experiences.${index}.location`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Team Size"
                      name={`experiences.${index}.size`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Start Date"
                      name={`experiences.${index}.startDate`}
                      register={register}
                      type="date"
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="End Date"
                      name={`experiences.${index}.endDate`}
                      register={register}
                      type="date"
                    />
                    <FormTextArea
                      className="col-span-6"
                      errors={errors}
                      helperText="To create a list, start writing with -"
                      label="Description in Markdown format"
                      name={`experiences.${index}.description`}
                      register={register}
                    />
                  </>
                )}
                subheading="Related work experience for this position"
              />
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                arrayName="educations"
                arrayValue={DEFAULT_RESUME_FORM.educations[0]}
                control={control}
                heading="Education"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Name"
                      name={`educations.${index}.facility`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Location"
                      name={`educations.${index}.location`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6"
                      errors={errors}
                      label="Degree"
                      name={`educations.${index}.degree`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Start Date"
                      name={`educations.${index}.startDate`}
                      register={register}
                      type="date"
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="End Date"
                      name={`educations.${index}.endDate`}
                      register={register}
                      type="date"
                    />
                    <FormTextArea
                      className="col-span-6"
                      errors={errors}
                      helperText="To create a list, start writing with -"
                      label="Description in Markdown format"
                      name={`educations.${index}.description`}
                      register={register}
                    />
                  </>
                )}
                subheading="Academic background"
              />
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                arrayName="projects"
                arrayValue={DEFAULT_RESUME_FORM.projects[0]}
                control={control}
                heading="Projects"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Name"
                      name={`projects.${index}.title`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6"
                      errors={errors}
                      label="Description"
                      name={`projects.${index}.subtitle`}
                      register={register}
                    />
                    <FormTextArea
                      className="col-span-6"
                      errors={errors}
                      helperText="To create a list, start writing with -"
                      label="Description in Markdown format"
                      name={`projects.${index}.description`}
                      register={register}
                    />
                  </>
                )}
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Name"
                      name={`projects.${index}.title`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6"
                      errors={errors}
                      label="Description"
                      name={`projects.${index}.subtitle`}
                      register={register}
                    />
                    <FormTextArea
                      className="col-span-6"
                      errors={errors}
                      helperText="To create a list, start writing with -"
                      label="Description in Markdown format"
                      name={`projects.${index}.description`}
                      register={register}
                    />
                  </>
                )}
              />
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                arrayName="skills"
                arrayValue={DEFAULT_RESUME_FORM.skills[0]}
                control={control}
                heading="Skills"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Category"
                      name={`skills.${index}.title`}
                      register={register}
                    />
                    <FormTextArea
                      className="col-span-6"
                      errors={errors}
                      label="Description"
                      name={`skills.${index}.items`}
                      register={register}
                    />
                  </>
                )}
                subheading="Related skills for applying positions"
              />
            </Tab.Panel>

            <Tab.Panel>
              <FormArraySection
                arrayName="languages"
                arrayValue={DEFAULT_RESUME_FORM.languages[0]}
                control={control}
                heading="Languages"
                renderFormItems={(index: number) => (
                  <>
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Name"
                      name={`languages.${index}.name`}
                      register={register}
                    />
                    <FormInput
                      className="col-span-6 sm:col-span-3"
                      errors={errors}
                      label="Proficiency"
                      name={`languages.${index}.proficiency`}
                      register={register}
                    />
                  </>
                )}
                subheading="Communication Tools"
              />
            </Tab.Panel>

            <div className="bg-base-200/40 px-4 py-3 text-right sm:px-6">
              <button className="btn btn-primary" type="submit">
                Save
              </button>
            </div>
          </Tab.Panels>
        </form>
      </div>
    </Tab.Group>
  );
}
