import { chakra, Flex, SimpleGrid } from "@chakra-ui/react";

import { SectionId } from "@/constants/nav";
import { GetHomePageQuery } from "@/services/query.generated";

import SectionWrapper from "./SectionWrapper";

interface ResourceCardProps {
  title: string;
  description: string;
}

function ResourceCard({ title, description }: Partial<ResourceCardProps>) {
  return (
    <Flex as="article" flexDir="column" rounded="md" shadow="sm" p={2} bg="orange.50">
      <chakra.h3 fontSize="lg" fontWeight="bold">
        {title}
      </chakra.h3>
      <chakra.p>{description}</chakra.p>
    </Flex>
  );
}

interface ResourceSectionProps {
  data: GetHomePageQuery["resourceSection"];
}

export default function ResourceSection({ data }: ResourceSectionProps) {
  return (
    <SectionWrapper
      id={SectionId.Resource}
      tag="resource"
      title={data?.data?.attributes?.section?.title}
      description={data?.data?.attributes?.section?.description}
    >
      <SimpleGrid columns={[2, 3, 4]} spacing={3}>
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
      </SimpleGrid>
    </SectionWrapper>
  );
}
