import { ApolloClient, InMemoryCache } from "@apollo/client";

import { GITHUB_ENDPOINT } from "@/constants/github";

const client = new ApolloClient({
  uri: GITHUB_ENDPOINT,
  cache: new InMemoryCache(),
  headers: {
    authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_ACCESS_TOKEN}`,
  },
});

export default client;
