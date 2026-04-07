import { Box } from "@chakra-ui/react";
import LoginPage, { type FormValue } from "@howardism/login-form";
import { useRouter } from "next/router";
import { useEffect } from "react";

import useAuth from "@/hooks/useAuth";

export default function Page(): JSX.Element {
  const { isLoggedIn, login } = useAuth();
  const router = useRouter();

  const onLogin = async (value: FormValue) => {
    await login({
      identifier: value.email,
      password: value.password,
    });
  };

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/create");
    }
  }, [isLoggedIn, router]);

  return (
    <Box minH="100vh" pt="8" px="4">
      <LoginPage onLogin={onLogin} />
    </Box>
  );
}
