import { z } from "zod"

export const experienceSchema = z.object({
  company: z.string(),
  location: z.string(),
  title: z.string(),
  size: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  items: z.string(),
})

export const projectSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  items: z.string(),
})

export const educationSchema = z.object({
  facility: z.string(),
  degree: z.string(),
  location: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  items: z.string(),
})

export const skillSchema = z.object({
  title: z.string(),
  items: z.string(),
})

export const languageSchema = z.object({
  name: z.string(),
  proficiency: z.string(),
})

export const resumeSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  github: z.string(),
  website: z.string(),

  company: z.string(),
  position: z.string(),
  summary: z.string(),

  experiences: z.array(experienceSchema).nonempty(),
  projects: z.array(projectSchema).nonempty(),
  educations: z.array(educationSchema).nonempty(),
  skills: z.array(skillSchema).nonempty(),
  languages: z.array(languageSchema).nonempty(),
})

export type ResumeSchema = z.infer<typeof resumeSchema>
