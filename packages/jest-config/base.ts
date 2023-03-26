import type { Config } from "jest"

export const base: Config = {
  roots: ["<rootDir>"],
  setupFilesAfterEnv: ["@howardism/jest-config/setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
}
