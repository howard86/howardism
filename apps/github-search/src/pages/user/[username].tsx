import React, { FC } from "react";
import { useRouter } from "next/router";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { ApolloQueryResult } from "@apollo/client";
import {
  useBreakpointValue,
  Box,
  Flex,
  Heading,
  Img,
  List,
  Spacer,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import { BsFillPersonCheckFill, BsFillPersonPlusFill } from "react-icons/bs";
import { RiGitRepositoryLine } from "react-icons/ri";

import InfoList from "@/components/InfoList";
import ProfileField from "@/components/ProfileField";
import ProfileBadge from "@/components/ProfileBadge";
import client from "@/utils/apollo-client";
import { GetUserDocument, GetUserQuery } from "@/generated/graphql";
import { GITHUB_BASE_URL } from "@/constants/github";

const isBadgeKey = (key: string) => key.startsWith("is") || key.startsWith("has");

const UserPage: FC<GetUserQuery["user"]> = ({
  name,
  login,
  avatarUrl,
  repositories,
  followers,
  following,
  ...rest
}) => {
  const router = useRouter();
  const display = useBreakpointValue({ base: "none", md: "inline-flex" });

  const badgeKeys = Object.keys(rest).filter(isBadgeKey);
  const profileKeys = Object.keys(rest).filter(
    (key) =>
      !isBadgeKey(key) &&
      !["__typename", "children"].includes(key) &&
      ["string", "number"].includes(typeof rest[key])
  );

  if (router.isFallback) {
    return <Spinner />;
  }

  return (
    <Flex mx={[4, 8, 12]} w="full" direction={["column", "row"]} align={["center", "start"]}>
      <VStack w={["full", "24rem"]}>
        <Img
          borderRadius="full"
          boxSize="200"
          htmlHeight="200"
          htmlWidth="200"
          src={avatarUrl}
          alt={name}
        />
        <Heading as="h1" fontWeight="medium">
          {name}
        </Heading>
        <Wrap>{badgeKeys.map((key) => rest[key] && <ProfileBadge key={key} name={key} />)}</Wrap>
        <Box>
          {profileKeys.map((key) => (
            <ProfileField key={key} fieldKey={key} fieldValue={rest[key]} />
          ))}
        </Box>
      </VStack>
      <Spacer mx={[0, 2]} my={[4, 0]} />
      <Tabs minW={["90%", "sm", "md"]} w={["auto", "80%"]} variant="enclosed" isFitted>
        <TabList>
          <Tab>
            Repository
            <Tag colorScheme="teal" ml="1" display={display}>
              {repositories.nodes.length}
            </Tag>
          </Tab>
          <Tab>
            Follower
            <Tag colorScheme="blue" ml="1" display={display}>
              {followers.nodes.length}
            </Tag>
          </Tab>
          <Tab>
            Following
            <Tag colorScheme="purple" ml="1" display={display}>
              {following.nodes.length}
            </Tag>
          </Tab>
        </TabList>
        <TabPanels overflowY="auto">
          <TabPanel>
            <List spacing={2}>
              {repositories.nodes.map(({ name }) => (
                <InfoList
                  key={name}
                  name={name}
                  url={`${GITHUB_BASE_URL}/${login}/${name}`}
                  icon={RiGitRepositoryLine}
                />
              ))}
            </List>
          </TabPanel>
          <TabPanel>
            <List spacing={2}>
              {followers.nodes.map(({ login }) => (
                <InfoList key={login} name={login} icon={BsFillPersonPlusFill} />
              ))}
            </List>
          </TabPanel>
          <TabPanel>
            <List spacing={2}>
              {following.nodes.map(({ login }) => (
                <InfoList key={login} name={login} icon={BsFillPersonCheckFill} />
              ))}
            </List>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: true,
});

export const getStaticProps: GetStaticProps = async (context) => {
  const username = context.params.username as string;

  let result: ApolloQueryResult<GetUserQuery>;
  try {
    result = await client.query<GetUserQuery>({
      query: GetUserDocument,
      variables: { username },
    });
  } catch (error) {
    console.error(error);
    return { notFound: true };
  }

  return {
    props: result.data.user,
    revalidate: 60,
  };
};

export default UserPage;
