import React, { FormEvent } from "react";
import {
  chakra,
  Button,
  FormControl,
  FormLabel,
  HTMLChakraProps,
  Input,
  Stack,
} from "@chakra-ui/react";
import PasswordField from "./PasswordField";

const LoginForm = (props: HTMLChakraProps<"form">): JSX.Element => {
  const handleOnSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <chakra.form onSubmit={handleOnSubmit} {...props}>
      <Stack spacing="6">
        <FormControl id="email">
          <FormLabel>Email address</FormLabel>
          <Input name="email" type="email" autoComplete="email" required />
        </FormControl>
        <PasswordField />
        <Button type="submit" size="lg" fontSize="md">
          Sign in
        </Button>
      </Stack>
    </chakra.form>
  );
};

export default LoginForm;
