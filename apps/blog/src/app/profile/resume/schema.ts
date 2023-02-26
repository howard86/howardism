import { z } from "zod"

const emptyString = z.literal("")
const optionalNumber = z.number().optional()
const optionalString = z.string().optional().or(emptyString)
const requiredString = z.string().min(1, { message: "This field is required" })
const requiredDate = z
  .string()
  .regex(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, { message: "Invalid date format" })

export const experienceSchema = z.object({
  id: optionalString,
  company: requiredString,
  companyUrl: z.string().url().or(emptyString),
  companyDescription: optionalString,
  location: requiredString,
  title: requiredString,
  size: requiredString,
  startDate: requiredDate,
  endDate: requiredDate.or(emptyString),
  items: optionalString,
  description: optionalString,
})

export type ExperienceSchema = z.infer<typeof experienceSchema>

export const projectSchema = z.object({
  id: optionalString,
  title: requiredString,
  subtitle: requiredString,
  items: optionalString,
  ordering: optionalNumber,
  description: optionalString,
})

export type ProjectSchema = z.infer<typeof projectSchema>

export const educationSchema = z.object({
  id: optionalString,
  facility: requiredString,
  degree: requiredString,
  location: requiredString,
  startDate: requiredDate,
  endDate: requiredDate,
  items: optionalString,
  description: optionalString,
})

export type EducationSchema = z.infer<typeof educationSchema>

export const skillSchema = z.object({
  id: optionalString,
  title: requiredString,
  items: requiredString,
  ordering: optionalNumber,
})

export type SkillSchema = z.infer<typeof skillSchema>

export const languageSchema = z.object({
  id: optionalString,
  name: requiredString,
  proficiency: requiredString,
  ordering: optionalNumber,
})

export type LanguageSchema = z.infer<typeof languageSchema>

export const resumeSchema = z.object({
  id: optionalString,
  name: requiredString,
  address: requiredString,
  phone: requiredString,
  email: requiredString.email(),
  github: requiredString,
  website: requiredString.url(),

  company: requiredString,
  position: requiredString,
  summary: requiredString,

  // TODO: add non empty validation
  experiences: z.array(experienceSchema),
  projects: z.array(projectSchema),
  educations: z.array(educationSchema),
  skills: z.array(skillSchema),
  languages: z.array(languageSchema),
})

export type ResumeSchema = z.infer<typeof resumeSchema>
