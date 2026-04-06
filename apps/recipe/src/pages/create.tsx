import { Container, Heading } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

import RecipeForm from "@/components/RecipeForm";
import useAuth from "@/hooks/useAuth";

export default function CreateRecipePage(): JSX.Element {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/signin");
    }
  }, [router, isLoggedIn]);

  return (
    <Container
      bg="white"
      borderRadius="lg"
      mt="32"
      px={{ base: 4, md: 10 }}
      py="8"
    >
      <Heading
        as="h1"
        fontWeight="extrabold"
        my="6"
        size="xl"
        textAlign="center"
      >
        編寫你專屬的食譜吧！
      </Heading>
      <RecipeForm />
    </Container>
  );
}
