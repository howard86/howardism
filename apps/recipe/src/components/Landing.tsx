import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import React, { FC } from "react";

import Image from "./Image";
import Triangle from "./Triangle";

interface LandingProps {
  imageUrl: string;
}

const Landing: FC<LandingProps> = ({ imageUrl }) => {
  const onClick = () => {
    // TODO: add scrolling effect to next heading
    alert("clicked!");
  };

  return (
    <Flex flexDirection="column" position="relative" minH="100vh" color="white">
      <Triangle zIndex="1" />
      <Image
        src="/assets/background.jpg"
        alt="Landing page background"
        layout="fill"
        objectFit="cover"
        objectPosition="center"
        filter="blur(4px)"
        quality="50"
        overflow="hidden"
      />
      {/* TODO: add Text Animation */}
      <Flex
        flexDir="column"
        alignItems="center"
        position="relative"
        mx="8"
        my="12"
        spacing={10}
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
            src={imageUrl}
            width={320}
            height={218}
            priority
            borderRadius="lg"
            shadow="lg"
          />
        </Box>
        <Box
          p="4"
          borderRadius="lg"
          bgGradient="linear(to-r, primary.500, primary.900)"
          shadow="lg"
        >
          <Heading fontSize="xl">SHARE YOURS, TOO!</Heading>
          <Text mt="4" mb="8">
            This is a recipe collection for home-made goodies
          </Text>
          <Button colorScheme="secondary" ml="2" onClick={onClick}>
            LEARN MORE
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Landing;
