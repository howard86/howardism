import { z } from "zod"

const requiredString = z.string().min(1, { message: "This field is required" })
const requiredDate = z
  .string()
  .regex(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g, { message: "Invalid date format" })

export const experienceSchema = z.object({
  company: requiredString,
  location: requiredString,
  title: requiredString,
  size: requiredString,
  startDate: requiredDate,
  endDate: requiredDate.or(z.string().regex(/^$/)),
  items: requiredString,
})

export const projectSchema = z.object({
  title: requiredString,
  subtitle: requiredString,
  items: requiredString,
})

export const educationSchema = z.object({
  facility: requiredString,
  degree: requiredString,
  location: requiredString,
  startDate: requiredDate,
  endDate: requiredDate,
  items: requiredString,
})

export const skillSchema = z.object({
  title: requiredString,
  items: requiredString,
})

export const languageSchema = z.object({
  name: requiredString,
  proficiency: requiredString,
})

export const resumeSchema = z.object({
  name: requiredString,
  address: requiredString,
  phone: requiredString,
  email: requiredString.email(),
  github: requiredString,
  website: requiredString.url(),

  company: requiredString,
  position: requiredString,
  summary: requiredString,

  experiences: z.array(experienceSchema).nonempty(),
  projects: z.array(projectSchema).nonempty(),
  educations: z.array(educationSchema).nonempty(),
  skills: z.array(skillSchema).nonempty(),
  languages: z.array(languageSchema).nonempty(),
})

export type ResumeSchema = z.infer<typeof resumeSchema>
