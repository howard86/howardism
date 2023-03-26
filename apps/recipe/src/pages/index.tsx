import type { GetStaticPropsResult } from "next"

import Home, { HomeProps } from "@/components/templates/Home"
import { getRecipes } from "@/services/recipe"

export const getStaticProps = async (): Promise<GetStaticPropsResult<HomeProps>> => {
  const results = await getRecipes()

  return {
    props: {
      recipes: results,
    },
    // Update every one hour
    revalidate: 3600,
  }
}

export type { HomeProps }
export default Home
