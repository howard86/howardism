import type { ParsedUrlQuery } from "node:querystring";
import { Badge } from "@howardism/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@howardism/ui/components/tabs";
import { GitBranch, Loader2, UserCheck, UserPlus } from "lucide-react";
import type {
  GetStaticPathsResult,
  GetStaticPropsContext,
  GetStaticPropsResult,
} from "next";
import Image from "next/image";
import { useRouter } from "next/router";

import InfoList from "@/components/InfoList";
import ProfileBadge from "@/components/ProfileBadge";
import ProfileField from "@/components/ProfileField";
import { GITHUB_BASE_URL } from "@/constants/github";
import { GetUserDocument, type GetUserQuery } from "@/generated/graphql";
import client from "@/utils/apollo-client";

const isBadgeKey = (key: string) =>
  key.startsWith("is") || key.startsWith("has");

export default function UserPage({
  name,
  login,
  avatarUrl,
  repositories,
  followers,
  following,
  ...rest
}: NonNullable<GetUserQuery["user"]>) {
  const router = useRouter();

  const badgeKeys = Object.keys(rest).filter(isBadgeKey);
  const profileKeys = Object.keys(rest).filter(
    (key) =>
      !(isBadgeKey(key) || ["__typename", "children"].includes(key)) &&
      ["string", "number"].includes(typeof rest[key as keyof typeof rest])
  );

  if (router.isFallback) {
    return <Loader2 className="size-8 animate-spin" />;
  }

  const username = name || "";

  return (
    <div className="mx-4 flex w-full flex-col items-center gap-4 sm:mx-8 sm:flex-row sm:items-start md:mx-12">
      <div className="flex w-full flex-col items-center gap-2 sm:w-96">
        <Image
          alt={username}
          className="rounded-full"
          height={200}
          src={avatarUrl}
          width={200}
        />
        <h1 className="font-medium text-2xl">{username}</h1>
        <ul className="flex flex-wrap gap-2">
          {badgeKeys.map(
            (key) =>
              rest[key as keyof typeof rest] && (
                <ProfileBadge key={key} name={key} />
              )
          )}
        </ul>
        <div>
          {profileKeys.map((key) => (
            <ProfileField
              fieldKey={key}
              fieldValue={rest[key as keyof typeof rest] as string | number}
              key={key}
            />
          ))}
        </div>
      </div>
      <div className="my-4 sm:mx-2 sm:my-0 sm:flex-1" />
      <Tabs
        className="w-auto min-w-[90%] sm:w-4/5 sm:min-w-96"
        defaultValue="repositories"
      >
        <TabsList className="w-full">
          <TabsTrigger className="flex-1" value="repositories">
            Repository
            <Badge className="ml-1 hidden md:inline-flex">
              {repositories?.nodes?.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="followers">
            Follower
            <Badge className="ml-1 hidden md:inline-flex" variant="secondary">
              {followers?.nodes?.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="following">
            Following
            <Badge className="ml-1 hidden md:inline-flex" variant="outline">
              {following?.nodes?.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent className="overflow-y-auto" value="repositories">
          <ul className="space-y-2">
            {repositories?.nodes?.map((repo, index) => {
              const repoName = repo ? repo.name : `${index}-repoName`;
              return (
                <InfoList
                  icon={GitBranch}
                  key={repoName}
                  name={repoName}
                  url={`${GITHUB_BASE_URL}/${login}/${repoName}`}
                />
              );
            })}
          </ul>
        </TabsContent>
        <TabsContent value="followers">
          <ul className="space-y-2">
            {followers?.nodes?.map((follower, index) => {
              const followeeName = follower
                ? follower.login
                : `${index}-repoName`;
              return (
                <InfoList
                  icon={UserPlus}
                  key={followeeName}
                  name={followeeName}
                />
              );
            })}
          </ul>
        </TabsContent>
        <TabsContent value="following">
          <ul className="space-y-2">
            {following?.nodes?.map((followee, index) => {
              const followerName = followee
                ? followee.login
                : `${index}-repoName`;
              return (
                <InfoList
                  icon={UserCheck}
                  key={followerName}
                  name={followerName}
                />
              );
            })}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface QueryPath extends ParsedUrlQuery {
  username: string;
}

export const getStaticPaths = async (): Promise<
  GetStaticPathsResult<QueryPath>
> => ({
  paths: [],
  fallback: true,
});

export const getStaticProps = async (
  context: GetStaticPropsContext<QueryPath>
): Promise<GetStaticPropsResult<GetUserQuery["user"]>> => {
  if (!context.params) {
    return { notFound: true };
  }

  let result: Awaited<ReturnType<typeof client.query<GetUserQuery>>>;
  try {
    result = await client.query<GetUserQuery>({
      query: GetUserDocument,
      variables: { username: context.params.username },
    });
  } catch (error) {
    console.error(error);
    return { notFound: true };
  }

  if (!result.data?.user) {
    return { notFound: true };
  }

  return {
    props: result.data.user,
    revalidate: 60,
  };
};
