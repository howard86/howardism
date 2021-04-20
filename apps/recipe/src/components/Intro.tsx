import React, { FC } from "react";
import NextLink from "next/link";
import { Box, Heading, VStack, LinkBox, Icon, LinkOverlay } from "@chakra-ui/react";
import { FiShare } from "react-icons/fi";

import RecipeCard from "./RecipeCard";

const Intro: FC = () => {
  return (
    <Box p="8">
      <Heading fontSize="xl">Top Recipes</Heading>
      <VStack my="4" spacing={6}>
        <RecipeCard
          id="1"
          title="Braised Pork Rice"
          description="This is an amazing braised pork rice to follow!"
          timestamp={new Date().toString()}
          imageUrl="https://bit.ly/dan-abramov"
        />
        <RecipeCard
          id="1"
          title="Braised Pork Rice"
          description="This is an amazing braised pork rice to follow!"
          timestamp={new Date().toString()}
          imageUrl="https://bit.ly/dan-abramov"
        />
        <LinkBox
          p="4"
          maxW="sm"
          rounded="lg"
          borderStyle="dotted"
          borderWidth="2px"
          borderColor="blackAlpha.400"
        >
          <Heading as="h3" fontSize="lg">
            <NextLink href="create" passHref>
              <LinkOverlay>
                <Icon as={FiShare} /> Share yours here!
              </LinkOverlay>
            </NextLink>
          </Heading>
        </LinkBox>
      </VStack>
    </Box>
  );
};

export default Intro;
