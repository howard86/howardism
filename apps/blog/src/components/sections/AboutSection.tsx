import {
  Box,
  Center,
  chakra,
  Container,
  Divider,
  Heading,
  List,
  ListItem,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Image } from "@howardism/components-common";

import profilePicture from "@/../public/profile.jpeg";

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
    <Container as="section" id="about" my="60px" maxW="container.xl">
      <chakra.span
        pos="relative"
        fontWeight="medium"
        color="secondary.500"
        mb={3}
        _before={{
          position: "absolute",
          content: "''",
          w: 10,
          height: "1px",
          backgroundColor: "secondary.500",
          top: "50%",
          transform: "translateY(-50%)",
          left: "100%",
          mx: 2.5,
        }}
      >
        About
      </chakra.span>
      <Heading fontSize="5xl" mb={4}>
        About Me
      </Heading>
      <Text>Howardism&apos;s whereabouts</Text>
      <SimpleGrid columns={[1, null, 2]} gap={10} mt={12}>
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
    </Container>
  );
}
