import { Box, CheckboxGroup, Flex, Heading, Spinner, Text, VStack } from "@chakra-ui/react"
import type { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from "next"
import { useRouter } from "next/router"

import logo from "@/../public/favicon/logo.png"
import LayerCheckboxes from "@/components/LayerCheckboxes"
import { NAV_BAR_HEIGHT } from "@/components/NavBar"
import ProcedureStep from "@/components/ProcedureStep"
import { getRecipeById, getRecipes } from "@/services/recipe"
import type { Recipe } from "@/types/recipe"
import { Image } from "@howardism/components-common"

export default function RecipePage({
  title,
  image,
  description,
  ingredients,
  seasonings,
  steps,
}: Recipe) {
  const router = useRouter()

  if (router.isFallback) {
    return <Spinner />
  }

  return (
    <VStack px="4" spacing={[4, 6, 8]}>
      <Box h={NAV_BAR_HEIGHT} />
      <Image
        alt={title}
        src={image[0] ? image[0].formats.small.url : logo}
        width={320}
        height={218}
        borderRadius="lg"
        shadow="lg"
        objectFit="contain"
        priority
      />
      <Heading as="h1">{title}</Heading>
      <Text>{description}</Text>
      <Flex maxW="container.md" w="full" direction={{ base: "column", md: "row" }}>
        <Box p="4" minW="60" flexShrink={0}>
          <CheckboxGroup colorScheme="secondary">
            <LayerCheckboxes title="材料 🍖" options={ingredients} />
            <LayerCheckboxes title="調味料 🧂" options={seasonings} />
          </CheckboxGroup>
        </Box>
        <ProcedureStep flex="1" p="4" steps={steps} />
      </Flex>
    </VStack>
  )
}

type QueryPath = {
  id: string
}

export const getStaticPaths = async (): Promise<GetStaticPathsResult<QueryPath>> => {
  const results = await getRecipes()

  return {
    paths: results.map((result) => ({
      params: {
        id: result.id.toString(),
      },
    })),
    fallback: "blocking",
  }
}

export const getStaticProps = async (
  context: GetStaticPropsContext<QueryPath>
): Promise<GetStaticPropsResult<Recipe>> => {
  if (!context.params) {
    return { notFound: true }
  }

  const recipe = await getRecipeById(context.params.id)

  if (recipe === null) {
    return {
      notFound: true,
    }
  }

  return {
    props: recipe,
    // Update cache every one hour
    revalidate: 3600,
  }
}
