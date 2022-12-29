import { SectionId } from "@/constants/nav"
import { GetHomePageQuery } from "@/services/query.generated"

import SectionWrapper from "./SectionWrapper"

interface ResourceCardProps {
  title: string
  description: string
}

function ResourceCard({ title, description }: Partial<ResourceCardProps>) {
  return (
    <article className="rounded-md border border-slate-50 bg-teal-100/5 p-2 shadow-sm  dark:text-white/90">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
    </article>
  )
}

interface ResourceSectionProps {
  data: GetHomePageQuery["resourceSection"]
}

export default function ResourceSection({ data }: ResourceSectionProps) {
  return (
    <SectionWrapper
      id={SectionId.Resource}
      tag="resource"
      title={data?.data?.attributes?.section?.title}
      description={data?.data?.attributes?.section?.description}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data?.data?.attributes?.books?.data.map((item) => (
          <ResourceCard
            key={item.id}
            title={item.attributes?.name}
            description={item.attributes?.summary}
          />
        ))}
        {data?.data?.attributes?.websites?.data.map((item) => (
          <ResourceCard
            key={item.id}
            title={item.attributes?.name}
            description={item.attributes?.summary}
          />
        ))}
      </div>
    </SectionWrapper>
  )
}
