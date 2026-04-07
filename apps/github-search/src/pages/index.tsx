import {
  Button,
  Input,
  Stack,
  useBreakpointValue,
  VStack,
  Wrap,
} from "@chakra-ui/react";

import UserCard from "@/components/UserCard";
import useSearch from "@/hooks/use-search";

export default function HomePage() {
  const count = useBreakpointValue({ base: 9, sm: 12, md: 18, lg: 15, xl: 25 });
  const { state, result, onType, onSearch } = useSearch(count);

  return (
    <VStack my="auto" spacing={[4, 8]}>
      <Stack align="center" direction={["column", "row"]}>
        <Input
          aria-label="GitHub Search"
          name="search"
          onChange={onType}
          placeholder="GitHub username"
          type="text"
          value={state.username}
        />
        <Button isLoading={result.loading} onClick={onSearch}>
          Search
        </Button>
      </Stack>
      {result.data && (
        <Wrap justify="center" maxW="90ch" spacing={[4, 6, 8]}>
          {result?.data?.search?.nodes?.map(
            (user) =>
              user?.__typename === "User" && (
                <UserCard
                  avatarUrl={user.avatarUrl}
                  key={user.login}
                  username={user.login}
                />
              )
          )}
        </Wrap>
      )}
    </VStack>
  );
}
