import { Box, Heading } from "@chakra-ui/react";

import Card from "./Card";
import LoginForm, { type OnLogin } from "./LoginForm";

interface LoginPageProps {
  onLogin: OnLogin;
}

export default function LoginPage({ onLogin }: LoginPageProps): JSX.Element {
  return (
    <Box maxW="md" mx="auto">
      <Heading fontWeight="extrabold" my="6" size="xl" textAlign="center">
        Sign in to your account
      </Heading>
      <Card>
        <LoginForm onLogin={onLogin} />
      </Card>
    </Box>
  );
}
