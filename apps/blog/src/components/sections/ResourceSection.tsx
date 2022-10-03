import { chakra, Flex, SimpleGrid } from "@chakra-ui/react";

import SectionWrapper from "./SectionWrapper";

interface ResourceCardProps {
  title: string;
  description: string;
}

function ResourceCard({ title, description }: ResourceCardProps) {
  return (
    <Flex as="article" flexDir="column" rounded="md" shadow="sm" p={2} bg="orange.50">
      <chakra.h3 fontSize="lg" fontWeight="bold">
        {title}
      </chakra.h3>
      <chakra.p>{description}</chakra.p>
    </Flex>
  );
}

export default function ResourceSection() {
  return (
    <SectionWrapper
      tag="resource"
      title="Resources"
      description="Fun, thoughts, links, books and more"
    >
      <SimpleGrid columns={[2, 3, 4]} spacing={1}>
        <ResourceCard
          title="Clean Code by Robert C. Martin"
          description="A Handbook of Agile Software Craftsmanship"
        />
        <ResourceCard
          title="Coding Blocks"
          description="Nice podcast to follow up interesting thoughts of software programming"
        />
        <ResourceCard
          title="Online Soduku game"
          description="A home-made sudoku solver & generator. Help needed to determine the level!"
        />
        <ResourceCard
          title="The Snowball by Alice Schroeder"
          description="Warren Buffet and the business life"
        />
        <ResourceCard
          title="The Algorithms"
          description="Online website for a collection of real-life algorithms"
        />
        <ResourceCard
          title="craftzdog"
          description="Takuya, a full-stack developer & YouTuber sharing set up of devtools"
        />
        <ResourceCard title="NIPPON COLORS" description="Japanese theme palette selections" />
      </SimpleGrid>
    </SectionWrapper>
  );
}
