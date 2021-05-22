import React from "react";
import { Box, Heading } from "@chakra-ui/react";
import Card from "./Card";
import LoginForm from "./LoginForm";

const LoginPage = (): JSX.Element => (
  <Box maxW="md" mx="auto">
    <Heading textAlign="center" size="xl" fontWeight="extrabold" my="6">
      Sign in to your account
    </Heading>
    <Card>
      <LoginForm />
    </Card>
  </Box>
);

export default LoginPage;
