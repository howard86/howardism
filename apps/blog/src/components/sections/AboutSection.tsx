import Image from "next/image"
import ReactMarkdown from "react-markdown"

import profilePicture from "@/../public/profile.jpeg"
import { SectionId } from "@/constants/nav"
import { GetHomePageQuery } from "@/services/query.generated"

import SlideBox from "../animations/SlideBox"
import SectionWrapper from "./SectionWrapper"

interface AboutListItemProps {
  index: number
  title?: string
  description?: string
}

function AboutListItem({ title, description, index }: AboutListItemProps) {
  return (
    <li>
      <SlideBox className="dark:text-zinc-400" x={30} delay={0.2 + index * 0.12}>
        <span className="font-medium text-zinc-600 after:mx-0.5 after:text-inherit after:content-[':'] dark:text-white/90">
          {title}
        </span>
        {description}
      </SlideBox>
    </li>
  )
}

interface AboutSectionProps {
  data: GetHomePageQuery["aboutSection"]
}

export default function AboutSection({ data }: AboutSectionProps) {
  return (
    <SectionWrapper
      id={SectionId.About}
      tag="about"
      title={data?.data?.attributes?.section?.title}
      description={data?.data?.attributes?.section?.title}
    >
      <div className="relative flex flex-col justify-start gap-10 overflow-hidden md:flex-row">
        <SlideBox className="flex shrink-0 items-center justify-center" x={-40} duration={1.2}>
          <Image
            alt="github profile photo"
            src={profilePicture}
            className="overflow-hidden rounded-sm"
          />
        </SlideBox>
        <div>
          <ReactMarkdown className="prose dark:prose-invert">
            {data?.data?.attributes?.introduction || ""}
          </ReactMarkdown>
          <hr className="mb-4" />
          <h3 className="mb-6 text-xl font-bold dark:text-white/90">
            {data?.data?.attributes?.interest_title}
          </h3>
          <ul className="space-y-2">
            {data?.data?.attributes?.interest_items?.data.map((item, index) => (
              <AboutListItem
                key={item.id}
                title={item.attributes?.title}
                description={item.attributes?.description}
                index={index}
              />
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  )
}
