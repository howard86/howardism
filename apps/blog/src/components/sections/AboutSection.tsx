import { Box, chakra, Divider, Flex, Heading, List } from "@chakra-ui/react";
import { Image } from "@howardism/components-common";

import profilePicture from "@/../public/profile.jpeg";
import { SectionId } from "@/constants/nav";

import SlideBox from "../animations/SlideBox";

import SectionWrapper from "./SectionWrapper";

interface AboutListItemProps {
  index: number;
  title: string;
  description: string;
}

function AboutListItem({ title, description, index }: AboutListItemProps) {
  return (
    <SlideBox as="li" x={30} delay={0.2 + index * 0.12}>
      <chakra.span
        fontWeight="medium"
        color="gray.600"
        textTransform="capitalize"
        _after={{
          mx: 0.5,
          content: "':'",
          color: "secondary.700",
        }}
      >
        {title}
      </chakra.span>
      {description}
    </SlideBox>
  );
}

const ITEMS: Pick<AboutListItemProps, "title" | "description">[] = [
  { title: "programming experiences", description: "2 + 3 years" },
  { title: "best tech stack", description: "React" },
  { title: "favourite language", description: "TypeScript" },
  { title: "games", description: "HearthStone" },
  { title: "interests", description: "coding, reading, thinking" },
];

export default function AboutSection() {
  return (
    <SectionWrapper
      id={SectionId.About}
      tag="about"
      title="About Me"
      description={"Howardism's whereabouts"}
    >
      <Flex flexDirection={["column", "column", "row"]} justifyContent="start" gap={10}>
        <SlideBox
          display="flex"
          alignItems="center"
          justifyContent="center"
          x={-40}
          duration={1.2}
          flexShrink={0}
        >
          <Image alt="github profile photo" src={profilePicture} rounded="sm" overflow="hidden" />
        </SlideBox>
        <Box pos="relative">
          <SlideBox fontWeight="bold" as="h3" y={-20}>
            A Dedicated Web developer from Taiwan
          </SlideBox>
          <SlideBox as="p" y={-20} delay={0.3} mt={2}>
            I spend most of time thinking of solving problems and finding more problems as a
            product-oriented software engineer.
          </SlideBox>
          <Divider my={4} />
          <Heading>Other Info</Heading>
          <List pos="relative" spacing={2}>
            {/* TODO: use cms to inject */}
            {ITEMS.map((item, index) => (
              <AboutListItem
                key={item.title}
                title={item.title}
                description={item.description}
                index={index}
              />
            ))}
          </List>
        </Box>
      </Flex>
    </SectionWrapper>
  );
}
