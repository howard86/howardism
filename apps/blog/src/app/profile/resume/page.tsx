import {
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline"

import { Container } from "@/components/template/Container"
import { GitHubIcon } from "@/components/template/SocialIcons"
import { generateLoremIpsum } from "@/services/resume"

import ResumeTemplate from "./ResumeTemplate"

export default function ResumeSamplePage() {
  return (
    <Container className="mt-6 flex-1 sm:mt-12">
      <ResumeTemplate
        name="Howard Tai"
        summary={generateLoremIpsum(400)}
        contacts={[
          { Icon: MapPinIcon, text: "[Address]" },
          { Icon: DevicePhoneMobileIcon, text: "(+886) 987654321" },
          { Icon: EnvelopeIcon, text: "howard@howardism.dev" },
          { Icon: GitHubIcon, text: "Howard86" },
          { Icon: GlobeAltIcon, text: "howardism.dev" },
        ]}
        experiences={[
          {
            company: "Company A",
            location: "Remote",
            title: "Senior Software Engineer",
            size: "30",
            items: [generateLoremIpsum(200), generateLoremIpsum(140), generateLoremIpsum(76)],
            startMonth: "Jan 2020",
          },
          {
            company: "Company B",
            location: "Anywhere",
            title: "Software Engineer",
            size: "100-110",
            items: [generateLoremIpsum(200), generateLoremIpsum(140)],
            startMonth: "Jan 2018",
            endMonth: "Dec 2019",
          },
        ]}
        projects={[
          {
            name: "Awesome Project",
            description: generateLoremIpsum(12),
            items: [generateLoremIpsum(20), generateLoremIpsum(18), generateLoremIpsum(22)],
          },
          {
            name: "Blog",
            description: generateLoremIpsum(12),
            items: [generateLoremIpsum(20), generateLoremIpsum(18), generateLoremIpsum(22)],
          },
        ]}
        educations={[
          {
            name: "Awesome University",
            degree: "Computer Science",
            startMonth: "Oct 2014",
            endMonth: "Jul 2018",
            items: [generateLoremIpsum(20), generateLoremIpsum(16), generateLoremIpsum(8)],
          },
        ]}
        skills={[
          {
            category: "Libraries",
            items: [generateLoremIpsum(12), generateLoremIpsum(6), generateLoremIpsum(10)],
          },
          { category: "Frameworks", items: [generateLoremIpsum(30)] },
          { category: "Skill 3", items: [generateLoremIpsum(60)] },
          { category: "Skill 4", items: [generateLoremIpsum(100)] },
        ]}
        languages={[
          { name: "English", level: "fluent" },
          { name: "JavaScript", level: "fluent" },
          { name: "Java", level: "proficient" },
        ]}
      />
    </Container>
  )
}
