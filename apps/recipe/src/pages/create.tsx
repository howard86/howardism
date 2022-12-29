import { useEffect } from "react"
import { Container, Heading } from "@chakra-ui/react"
import { useRouter } from "next/router"

import RecipeForm from "@/components/RecipeForm"
import useAuth from "@/hooks/useAuth"

export default function CreateRecipePage(): JSX.Element {
  const router = useRouter()
  const { isLoggedIn } = useAuth()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/signin")
    }
  }, [router, isLoggedIn])

  return (
    <Container mt="32" py="8" px={{ base: 4, md: 10 }} bg="white" borderRadius="lg">
      <Heading as="h1" textAlign="center" size="xl" fontWeight="extrabold" my="6">
        編寫你專屬的食譜吧！
      </Heading>
      <RecipeForm />
    </Container>
  )
}
