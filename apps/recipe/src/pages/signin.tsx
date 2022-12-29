import { useEffect } from "react"
import { Box } from "@chakra-ui/react"
import { useRouter } from "next/router"

import useAuth from "@/hooks/useAuth"
import LoginPage, { FormValue } from "@howardism/login-form"

export default function Page(): JSX.Element {
  const { isLoggedIn, login } = useAuth()
  const router = useRouter()

  const onLogin = async (value: FormValue) => {
    await login({
      identifier: value.email,
      password: value.password,
    })
  }

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/create")
    }
  }, [isLoggedIn, router])

  return (
    <Box minH="100vh" px="4" pt="8">
      <LoginPage onLogin={onLogin} />
    </Box>
  )
}
