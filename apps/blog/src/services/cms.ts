import { GraphQLClient } from "graphql-request"

import { env } from "@/config/env.mjs"

import { getSdk } from "./query.generated"

if (!env.CMS_API_ENDPOINT || !env.CMS_API_KEY) throw new Error("Missing required env")

const client = new GraphQLClient(`${env.CMS_API_ENDPOINT}/graphql`, {
  headers: {
    Authorization: `Bearer ${env.CMS_API_KEY}`,
  },
})

const cms = getSdk(client)

export default cms
