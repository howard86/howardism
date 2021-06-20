import { Box, Heading } from "@chakra-ui/react";
import React from "react";

import Card from "./Card";
import LoginForm, { OnLogin } from "./LoginForm";

interface LoginPageProps {
  onLogin: OnLogin;
}

const LoginPage = ({ onLogin }: LoginPageProps): JSX.Element => (
  <Box maxW="md" mx="auto">
    <Heading textAlign="center" size="xl" fontWeight="extrabold" my="6">
      Sign in to your account
    </Heading>
    <Card>
      <LoginForm onLogin={onLogin} />
    </Card>
  </Box>
);

export default LoginPage;
