import {
  Box,
  Center,
  chakra,
  Divider,
  Heading,
  List,
  ListItem,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Image } from "@howardism/components-common";

import profilePicture from "@/../public/profile.jpeg";

import SectionWrapper from "./SectionWrapper";

interface AboutListItemProps {
  title: string;
  description: string;
}

function AboutListItem({ title, description }: AboutListItemProps) {
  return (
    <ListItem>
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
    </ListItem>
  );
}

export default function AboutSection() {
  return (
    <SectionWrapper tag="about" title="About Me" description={"Howardism's whereabouts"}>
      <SimpleGrid columns={[1, null, 2]} gap={10}>
        <Center data-aos="fade-right" data-aos-duration="1200">
          <Image src={profilePicture} rounded="sm" overflow="hidden" />
        </Center>
        <Box data-aos="fade-right" data-aos-duration="1200" data-aos-delay="50">
          <chakra.h3 fontWeight="bold">I&apos;m Howard Tai</chakra.h3>
          <chakra.h5>A Dedicated Web developer from Taiwan</chakra.h5>
          <Text mt={5}>
            I spend most of time thinking of solving problems and finding more problems as a
            product-oriented software engineer.
          </Text>
          <Divider my={4} />
          <Heading>Other Info</Heading>
          <List spacing={1}>
            <AboutListItem title="programming experiences" description="2 + 3 years" />
            <AboutListItem title="best tech stack" description="React" />
            <AboutListItem title="favourite language" description="TypeScript" />
            <AboutListItem title="games" description="HearthStone" />
            <AboutListItem title="interests" description="coding, reading, thinking" />
          </List>
        </Box>
      </SimpleGrid>
    </SectionWrapper>
  );
}
