import { Container } from "@/app/(common)/Container"
import { generateLoremIpsum, generateLoremIpsumArray } from "@/services/resume"

import ResumeDocument from "./ResumeDocument"

export default function ResumeSamplePage() {
  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <ResumeDocument
        company="Template"
        position="Template"
        name="Howard Tai"
        summary={generateLoremIpsum(400)}
        address="London"
        phone="+447554123456"
        email="example@gmail.com"
        github="github"
        website="https://example.com"
        experiences={[
          {
            company: "Company A",
            companyUrl: "",
            location: "Remote",
            title: "Senior Software Engineer",
            size: "30",
            items: generateLoremIpsumArray(200, 140, 76),
            startDate: "Jan 2020",
            endDate: "",
          },
          {
            company: "Company B",
            companyUrl: "",
            location: "Anywhere",
            title: "Software Engineer",
            size: "100-110",
            items: generateLoremIpsumArray(200, 137),
            startDate: "Jan 2018",
            endDate: "Dec 2019",
          },
        ]}
        projects={[
          {
            title: "Awesome Project",
            subtitle: generateLoremIpsum(12),
            items: generateLoremIpsumArray(20, 18, 22),
          },
          {
            title: "Blog",
            subtitle: generateLoremIpsum(12),
            items: generateLoremIpsumArray(20, 18, 22),
          },
        ]}
        educations={[
          {
            facility: "Awesome University",
            location: "World",
            degree: "Computer Science",
            startDate: "Oct 2014",
            endDate: "Jul 2018",
            items: generateLoremIpsumArray(20, 16, 8),
          },
        ]}
        skills={[
          {
            title: "Libraries",
            items: generateLoremIpsumArray(12, 6, 10),
          },
          { title: "Frameworks", items: generateLoremIpsumArray(30, 2, 12) },
          { title: "Skill 3", items: generateLoremIpsumArray(60) },
          { title: "Skill 4", items: generateLoremIpsumArray(100) },
        ]}
        languages={[
          { name: "English", proficiency: "fluent" },
          { name: "JavaScript", proficiency: "fluent" },
          { name: "Java", proficiency: "proficient" },
        ]}
      />
    </Container>
  )
}
