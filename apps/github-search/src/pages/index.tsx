import React, { FC } from "react";
import { Button, Input, Stack, VStack } from "@chakra-ui/react";
import useSearch from "@/hooks/use-search";

const HomePage: FC = () => {
  const { state, result, onType, onSearch } = useSearch();

  return (
    <VStack my="auto" spacing={[2, 4]} w="full">
      <Stack direction={["column", "row"]} align="center">
        <Input
          type="text"
          name="search"
          aria-label="GitHub Search"
          placeholder="GitHub username"
          value={state.username}
          onChange={onType}
        />
        <Button onClick={onSearch} isLoading={result.loading}>
          Search
        </Button>
        {/* TODO: add render result */}
      </Stack>
    </VStack>
  );
};

export default HomePage;
