import { Button, Input, Stack, useBreakpointValue, VStack, Wrap } from "@chakra-ui/react"

import UserCard from "@/components/UserCard"
import useSearch from "@/hooks/use-search"

export default function HomePage() {
  const count = useBreakpointValue({ base: 9, sm: 12, md: 18, lg: 15, xl: 25 })
  const { state, result, onType, onSearch } = useSearch(count)

  return (
    <VStack my="auto" spacing={[4, 8]}>
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
      </Stack>
      {result.data && (
        <Wrap spacing={[4, 6, 8]} justify="center" maxW="90ch">
          {result?.data?.search?.nodes?.map(
            (user) =>
              user?.__typename === "User" && (
                <UserCard key={user.login} avatarUrl={user.avatarUrl} username={user.login} />
              ),
          )}
        </Wrap>
      )}
    </VStack>
  )
}
