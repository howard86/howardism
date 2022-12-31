import nextJest from "next/jest"

import rootConfig from "../../jest.config"

const createJestConfig = nextJest({ dir: "./" })

module.exports = createJestConfig(rootConfig)
