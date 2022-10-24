import { GraphQLClient } from "graphql-request";

import { CMS_API_ENDPOINT, CMS_API_KEY } from "@/config";

import { getSdk } from "./query.generated";

if (!CMS_API_ENDPOINT || !CMS_API_KEY) throw new Error("Missing required env");

const client = new GraphQLClient(`${process.env.CMS_API_ENDPOINT}/graphql`, {
  headers: {
    Authorization: `Bearer ${CMS_API_KEY}`,
  },
});

const cms = getSdk(client);

export default cms;
