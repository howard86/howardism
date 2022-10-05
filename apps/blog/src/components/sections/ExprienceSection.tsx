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

import { SectionId } from "@/constants/nav";

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
  endDate,
  introduction,
  ...props
}: ExperienceCardProps) {
  return (
    <Box rounded="md" shadow="sm" p={4} bg="white" {...props}>
      <chakra.h3 fontSize="lg" fontWeight="bold">
        {title}
      </chakra.h3>
      <chakra.p fontSize="sm">{description}</chakra.p>
      <chakra.span color="gray.600">
        {startDate} - {endDate}
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
  // TODO: link with tech tools & inject from CMS
  tags: string[];
}

function ProjectCard({ title, description, tags, ...props }: ProjectCardProps) {
  return (
    <Flex flexDir="column" rounded="md" shadow="sm" p={4} bg="white" {...props}>
      <chakra.h3 fontSize="lg" fontWeight="bold">
        {title}
      </chakra.h3>
      <chakra.p>{description}</chakra.p>
      <Flex gap={1} flexWrap="wrap" mt={4} flex={1} alignItems="flex-end">
        {tags.map((tag) => (
          <chakra.span key={tag} color="secondary.500">
            #{tag}
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

function SkillCard({ title, description, icon = FiPackage, ...props }: SkillCardProps) {
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

export default function ExperienceSection() {
  return (
    <SectionWrapper
      id={SectionId.Exprience}
      tag="experience"
      title="Experience"
      description="A list of past records"
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
              <ProjectCard
                title="next-api-handler"
                description="lightweight nextjs api handler wrapper, portable & configurable for serverless environment"
                tags={["nextjs", "express"]}
              />
              <ProjectCard
                title="nextjs-template"
                description="battery-included nextjs template to bootstrap your nextjs project with preconfigured tools"
                tags={["nextjs", "Chakra UI", "Framer Motion", "Redux", "RTK Query"]}
              />
              <ProjectCard
                title="howardism"
                description="portfolio & blog page powered by Vercel & CMS "
                tags={["nextjs", "lerna", "nx"]}
              />
              <ProjectCard
                title="normalised-rtk-query-demo"
                description="Pokedex to experience normalised structure of RTK query within central redux resource"
                tags={["Redux", "RTK query"]}
              />
            </SimpleGrid>
          </TabPanel>
          <TabPanel px="0">
            <SimpleGrid columns={2} spacing={4}>
              <ExperienceCard
                title="Senior Fullstack Developer"
                description="Team size: 20+"
                companyName="Oddle"
                startDate="2021 Feb"
                endDate="Present"
                introduction="Leading developments on customer dashboards, connecting all services with one-stop managements"
                data-aos="fade-right"
                data-aos-duration="1200"
              />
              <ExperienceCard
                title="Team Lead"
                description="Team size: 3-5"
                companyName="Lootex"
                startDate="2019 Jul"
                endDate="2020 Nov"
                introduction="Led development on NFT marketplace in an early start-up (less than 10 members), responsible to delivery products smoothly while managing api servers & real-time database update"
                data-aos="fade-right"
                data-aos-duration="1200"
                data-aos-delay="200"
              />
              <ExperienceCard
                title="Product Manager"
                description="Team size: 10-30"
                companyName="FST Network"
                startDate="2018 Jan"
                endDate="2019 May"
                introduction="Managed product iteration & development on a proof-of-concept SaaS platform"
                data-aos="fade-right"
                data-aos-duration="1200"
              />
              <ExperienceCard
                title="Undergraduate & Postgraduate"
                description="Bachelor & Master of Mathematics"
                companyName="University of Warwick"
                startDate="2012 Sep"
                endDate="2016 Jul"
                introduction="Specialised in Algebraic Geometry & Topology, while undertaking computer science and developing mathematical & statistical modelling in Java and MATLAB. "
                data-aos="fade-right"
                data-aos-duration="1200"
                data-aos-delay="200"
              />
            </SimpleGrid>
          </TabPanel>
          <TabPanel px="0">
            <SimpleGrid columns={[1, 2, 2]} spacing={2}>
              <SkillCard
                title="TypeScript"
                description="A strongly typed programming language builds on JavaScript"
                data-aos="fade-right"
                data-aos-duration="1200"
              />
              <SkillCard
                title="React"
                description="A declarative, component-based JavaScript library for building user interfaces"
                data-aos="fade-right"
                data-aos-duration="1200"
                data-aos-delay="200"
              />
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SectionWrapper>
  );
}
