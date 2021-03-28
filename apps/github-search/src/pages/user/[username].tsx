import React, { FC } from "react";
import { useRouter } from "next/router";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { ApolloQueryResult } from "@apollo/client";
import { Spinner } from "@chakra-ui/react";

import client from "@/utils/apollo-client";
import { GetUserDocument, GetUserQuery } from "@/generated/graphql";

const UserPage: FC<GetUserQuery["user"]> = (props) => {
  const router = useRouter();

  if (router.isFallback) {
    return <Spinner />;
  }

  return <div>{props.email}</div>;
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
