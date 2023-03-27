import nextJest from "next/jest"

import { base } from "./base"

const createJestConfig = nextJest({ dir: "./" })

export const nextjs = createJestConfig(base)
