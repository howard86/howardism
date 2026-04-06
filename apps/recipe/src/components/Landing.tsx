import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { Image } from "@howardism/components-common";
import type { StaticImageData } from "next/image";

import backgroundImage from "@/../public/assets/background.jpg";

import Triangle from "./Triangle";

interface LandingProps {
  imageUrl: string | StaticImageData;
}

export default function Landing({ imageUrl }: LandingProps) {
  const onClick = () => {
    // TODO: add scrolling effect to next heading
    alert("clicked!");
  };

  return (
    <Flex color="white" flexDirection="column" minH="100vh" position="relative">
      <Triangle zIndex="1" />
      <Image
        alt="Landing page background"
        layout="fill"
        objectFit="cover"
        objectPosition="center"
        placeholder="blur"
        priority
        quality="50"
        src={backgroundImage}
      />
      {/* TODO: add Text Animation */}
      <Flex
        alignItems="center"
        flexDir="column"
        gap={10}
        mx="8"
        my="12"
        position="relative"
        sx={{
          "& > div": {
            my: "4",
            w: ["90%", "sm"],
          },
        }}
      >
        <Box>
          <Heading as="h1" fontSize="2xl">
            Check the BEST Recipe
          </Heading>
        </Box>
        <Box>
          <Image
            alt="demo-recipe"
            borderRadius="lg"
            height={218}
            priority
            shadow="lg"
            src={imageUrl}
            width={320}
          />
        </Box>
        <Box
          bgGradient="linear(to-r, primary.500, primary.900)"
          borderRadius="lg"
          p="4"
          shadow="lg"
        >
          <Heading fontSize="xl">SHARE YOURS, TOO!</Heading>
          <Text mb="8" mt="4">
            This is a recipe collection for home-made goodies
          </Text>
          <Button colorScheme="secondary" ml="2" onClick={onClick}>
            LEARN MORE
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
}
