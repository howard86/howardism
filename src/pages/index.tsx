import React, { FC } from "react";
import { Box, Flex, Heading } from "rebass/styled-components";

const HomePage: FC = () => {
  return (
    <Flex flexDirection="column">
      <Box m={2}>
        <Heading>Blog</Heading>
        {/* TODO: add Posts */}
      </Box>
    </Flex>
  );
};

export default HomePage;
