import { Button } from "@howardism/ui/components/button";
import { Input } from "@howardism/ui/components/input";
import { Loader2 } from "lucide-react";

import UserCard from "@/components/UserCard";
import useSearch from "@/hooks/use-search";

const COUNT = 25;

export default function HomePage() {
  const { state, result, onType, onSearch } = useSearch(COUNT);

  return (
    <div className="my-auto flex flex-col items-center gap-4 sm:gap-8">
      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <Input
          aria-label="GitHub Search"
          name="search"
          onChange={onType}
          placeholder="GitHub username"
          type="text"
          value={state.username}
        />
        <Button disabled={result.loading} onClick={onSearch}>
          {result.loading && <Loader2 className="animate-spin" />}
          Search
        </Button>
      </div>
      {result.data && (
        <div className="grid w-full max-w-[90ch] grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-4 sm:gap-6 md:gap-8">
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
        </div>
      )}
    </div>
  );
}
