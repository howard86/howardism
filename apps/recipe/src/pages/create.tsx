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
    <div className="mx-auto mt-32 w-full max-w-2xl rounded-lg bg-white px-4 py-8 md:px-10">
      <h1 className="my-6 text-center font-extrabold text-2xl">
        編寫你專屬的食譜吧！
      </h1>
      <RecipeForm />
    </div>
  );
}
