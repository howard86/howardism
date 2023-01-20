import { Container } from "@/components/template/Container"
import { generateLoremIpsum } from "@/services/resume"

import ResumeTemplate from "./ResumeTemplate"

export default function ResumeSamplePage() {
  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <ResumeTemplate
        name="Howard Tai"
        summary={generateLoremIpsum(400)}
        address="[Address]"
        phone="+44 7554123456"
        email="example@gmail.com"
        github="[GitHub username]"
        website="example.com"
        experiences={[
          {
            company: "Company A",
            location: "Remote",
            title: "Senior Software Engineer",
            size: "30",
            items: [generateLoremIpsum(200), generateLoremIpsum(140), generateLoremIpsum(76)],
            startDate: "Jan 2020",
          },
          {
            company: "Company B",
            location: "Anywhere",
            title: "Software Engineer",
            size: "100-110",
            items: [generateLoremIpsum(200), generateLoremIpsum(140)],
            startDate: "Jan 2018",
            endDate: "Dec 2019",
          },
        ]}
        projects={[
          {
            title: "Awesome Project",
            subtitle: generateLoremIpsum(12),
            items: [generateLoremIpsum(20), generateLoremIpsum(18), generateLoremIpsum(22)],
          },
          {
            title: "Blog",
            subtitle: generateLoremIpsum(12),
            items: [generateLoremIpsum(20), generateLoremIpsum(18), generateLoremIpsum(22)],
          },
        ]}
        educations={[
          {
            facility: "Awesome University",
            location: "World",
            degree: "Computer Science",
            startDate: "Oct 2014",
            endDate: "Jul 2018",
            items: [generateLoremIpsum(20), generateLoremIpsum(16), generateLoremIpsum(8)],
          },
        ]}
        skills={[
          {
            title: "Libraries",
            items: [generateLoremIpsum(12), generateLoremIpsum(6), generateLoremIpsum(10)],
          },
          { title: "Frameworks", items: [generateLoremIpsum(30)] },
          { title: "Skill 3", items: [generateLoremIpsum(60)] },
          { title: "Skill 4", items: [generateLoremIpsum(100)] },
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
