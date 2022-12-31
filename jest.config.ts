import { Config } from "jest"

const config: Config = {
  roots: ["<rootDir>"],
  setupFilesAfterEnv: ["<rootDir>/test/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  watchPlugins: ["jest-watch-typeahead/filename", "jest-watch-typeahead/testname"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@howardism/components-common$": "<rootDir>/../../packages/components/common",
    "^@howardism/(.*)$": "<rootDir>/../../packages/$1",
  },
}

export default config
