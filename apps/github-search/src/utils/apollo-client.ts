import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";

import { GITHUB_ENDPOINT } from "@/constants/github";

const client = new ApolloClient({
  link: createHttpLink({
    uri: GITHUB_ENDPOINT,
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN}`,
    },
  }),
  cache: new InMemoryCache(),
});

export default client;
