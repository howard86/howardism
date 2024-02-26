import type { Config } from "jest"

export const base: Config = {
  roots: ["<rootDir>"],
  setupFilesAfterEnv: ["@howardism/jest-config/setup.ts"],
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
}
