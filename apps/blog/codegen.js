const { loadEnvConfig } = require("@next/env")
const fs = require("fs")
const path = require("path")

const dir = process.cwd()
loadEnvConfig(dir)

const SCHEMA_PATH = "./graphql.schema.json"

/** @type{import('@graphql-codegen/cli').CodegenConfig} */
const commonConfig = {
  overwrite: true,
  documents: "src/**/*.graphql",
  generates: {
    "src/generated/types.ts": {
      plugins: [
        "typescript",
        {
          add: {
            content: "/* eslint-disable */",
          },
        },
      ],
      config: {
        maybeValue: "T",
        scalars: {
          Date: "string",
        },
      },
    },
    "src/": {
      preset: "near-operation-file",
      presetConfig: {
        baseTypesPath: "generated/types.ts",
      },
      plugins: [
        "typescript-operations",
        "typescript-graphql-request",
        {
          add: {
            content: "/* eslint-disable */",
          },
        },
      ],
      config: {
        dedupeFragments: true,
        exportFragmentSpreadSubTypes: true,
        maybeValue: "T",
        scalars: {
          Date: "string",
        },
      },
    },
  },
  hooks: {
    afterOneFileWrite: ["prettier --write"],
  },
}

if (process.env.CMS_SCHEMA_FETCHED === "true" && fs.existsSync(path.join(dir, SCHEMA_PATH))) {
  commonConfig.schema = SCHEMA_PATH
} else {
  const url = process.env.CMS_API_ENDPOINT

  if (!url) throw new Error("Missing CMS_API_ENDPOINT env")

  commonConfig.schema = `${url}/graphql`
  commonConfig.generates[SCHEMA_PATH] = {
    plugins: ["introspection"],
  }
}

module.exports = commonConfig
