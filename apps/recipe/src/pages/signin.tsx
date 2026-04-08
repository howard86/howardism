import LoginPage, { type FormValue } from "@howardism/login-form";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect } from "react";

import useAuth from "@/hooks/useAuth";

export default function Page(): React.JSX.Element {
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
    <div className="min-h-screen px-4 pt-8">
      <LoginPage onLogin={onLogin} />
    </div>
  );
}
