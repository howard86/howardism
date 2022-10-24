import type { IconType } from "react-icons";
import { FiPackage } from "react-icons/fi";
import {
  Box,
  BoxProps,
  chakra,
  Divider,
  Flex,
  FlexProps,
  Icon,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
} from "@chakra-ui/react";
import type { DeepPartial, DeepRequired } from "ts-essentials";

import { SectionId } from "@/constants/nav";
import { GetHomePageQuery } from "@/services/query.generated";
import { formatMonth } from "@/utils/time";

import SectionWrapper from "./SectionWrapper";

interface ExperienceCardProps extends BoxProps {
  title: string;
  description: string;
  companyName: string;
  // TODO: replace with Date/number
  startDate: string;
  endDate: string;
  introduction: string;
}

function ExperienceCard({
  title,
  description,
  companyName,
  startDate,
  endDate = "Present",
  introduction,
  ...props
}: Partial<ExperienceCardProps>) {
  return (
    <Box rounded="md" shadow="sm" p={4} bg="white" {...props}>
      <chakra.h3 fontSize="lg" fontWeight="bold">
        {title}
      </chakra.h3>
      <chakra.p fontSize="sm">{description}</chakra.p>
      <chakra.span color="gray.600">
        {formatMonth(startDate)} - {endDate ? formatMonth(endDate) : "Present"}
      </chakra.span>
      <Divider my={2} />
      <Tag colorScheme="secondary" mr={1}>
        {companyName}
      </Tag>
      <Text mt="2" color="gray.500">
        {introduction}
      </Text>
    </Box>
  );
}

interface ProjectCardProps extends FlexProps {
  title: string;
  description: string;
  tags: TagType[];
}

type TagType = DeepPartial<
  DeepRequired<GetHomePageQuery>["experienceSection"]["data"]["attributes"]["side_projects"]["data"][number]["attributes"]["tech_tools"]["data"][number]
>;

function ProjectCard({ title, description, tags, ...props }: Partial<ProjectCardProps>) {
  return (
    <Flex flexDir="column" rounded="md" shadow="sm" p={4} bg="white" {...props}>
      <chakra.h3 fontSize="lg" fontWeight="bold">
        {title}
      </chakra.h3>
      <chakra.p>{description}</chakra.p>
      <Flex gap={1} flexWrap="wrap" mt={4} flex={1} alignItems="flex-end">
        {tags?.map((tag) => (
          <chakra.span key={tag.id} color="secondary.500">
            #{tag.attributes?.name}
          </chakra.span>
        ))}
      </Flex>
    </Flex>
  );
}

interface SkillCardProps extends FlexProps {
  title: string;
  description: string;
  icon?: IconType;
}

function SkillCard({ title, description, icon = FiPackage, ...props }: Partial<SkillCardProps>) {
  return (
    <Flex rounded="md" shadow="sm" p={4} bg="white" gap={4} {...props}>
      <Icon color="primary.700" fontSize="3xl" alignSelf="center" as={icon} />
      <Box>
        <chakra.h3 fontWeight="bold">{title}</chakra.h3>
        <chakra.p fontSize="sm">{description}</chakra.p>
      </Box>
    </Flex>
  );
}

interface ExperienceSectionProps {
  data: GetHomePageQuery["experienceSection"];
}

export default function ExperienceSection({ data }: ExperienceSectionProps) {
  return (
    <SectionWrapper
      id={SectionId.Experience}
      tag="experience"
      title={data?.data?.attributes?.section?.title}
      description={data?.data?.attributes?.section?.description}
      bg="gray.50"
    >
      <Tabs variant="solid-rounded" colorScheme="secondary">
        <TabList gap={4}>
          <Tab rounded="md">Projects</Tab>
          <Tab rounded="md">Work</Tab>
          <Tab rounded="md">Skills</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px="0">
            <SimpleGrid columns={[1, 2, 3]} spacing={3}>
              {data?.data?.attributes?.side_projects?.data.map((item) => (
                <ProjectCard
                  key={item.id}
                  title={item.attributes?.name}
                  description={item.attributes?.description}
                  tags={item.attributes?.tech_tools?.data}
                />
              ))}
            </SimpleGrid>
          </TabPanel>
          <TabPanel px="0">
            <SimpleGrid columns={2} spacing={4}>
              {data?.data?.attributes?.work_experiences?.data.map((item) => (
                <ExperienceCard
                  key={item.id}
                  title={item.attributes?.job_title}
                  description={item.attributes?.job_subtitle}
                  companyName={item.attributes?.company_name}
                  startDate={item.attributes?.start_date}
                  endDate={item.attributes?.end_date}
                  introduction={item.attributes?.description}
                />
              ))}
            </SimpleGrid>
          </TabPanel>
          <TabPanel px="0">
            <SimpleGrid columns={[1, 2, 2]} spacing={2}>
              {data?.data?.attributes?.tech_tools?.data.map((item) => (
                <SkillCard
                  key={item.id}
                  title={item.attributes?.name}
                  description={item.attributes?.description}
                />
              ))}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SectionWrapper>
  );
}
